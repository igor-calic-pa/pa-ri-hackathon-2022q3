import functions from '@google-cloud/functions-framework';
import { EntityTypesClient } from "@google-cloud/dialogflow-cx";
import logger from 'npmlog'

import {createTicket} from "./persistence.js";


const cxEntityTypesClient = new EntityTypesClient({apiEndpoint: 'europe-west1-dialogflow.googleapis.com'});


const projectId = 'charli-agilecoach-hbsc-ncmled'
const locationId = 'europe-west1'
const agentId = 'c4334d7b-b59f-4373-819a-bae2f4e931db'
const parent = `projects/${projectId}/locations/${locationId}/agents/${agentId}`

const listEntityTypes = async(displayName) => {
    const entityTypes = [];
    // Construct request
    const request = {
        parent,
    };

    // Run request
    const iterable = await cxEntityTypesClient.listEntityTypesAsync(request);
    for await (const responsePage of iterable) {
        let append = false;
        if (displayName) {
            if (responsePage.displayName === displayName) {
                append = true;
            }
        } else {
            append = true;
        }
        if (append) {
            for (const entity of responsePage.entities) {
                entityTypes.push(entity.value)
            }
        }
    }
    return entityTypes;
}

const showAvailableProducts = async (req) => {
    const allTypes = await listEntityTypes('product-type');
    return `These are available products: ${allTypes.join(',')}`
}


const tagToFn = (tagName) => {
    const tagNameParts = tagName.replace('-', ' ').split(' ');
    let fn = '';
    for (let idx = 0; idx < tagNameParts.length; idx++) {
        const part = tagNameParts[idx];
        fn = fn.concat(idx === 0 ? part.substring(0, 1).toLowerCase() : part.substring(0, 1).toUpperCase(), part.substring(1))
    }
    return fn;
}

const defaultWelcomeIntent = async (webHookReq) => {
    return 'Hello from a GCF Webhook';
}

const getName = async (webHookReq) => {
    return 'My name is Flowhook';
}

const submitTicket = async (webHookReq) => {
    logger.info(`submitTicket ${webHookReq}...`);
    const sessionParams = webHookReq.sessionInfo.parameters
    const ticketId = await createTicket(sessionParams['product-type'], sessionParams['description'], sessionParams['current-user'])
    return `Created ticket with an id '${ticketId}'`;
}

const TAG_MAPPING = {
    'Default Welcome Intent': defaultWelcomeIntent,
    'get-name': getName,
    'show-products': showAvailableProducts,
    'submit-ticket': submitTicket,
}

const riDfWebHook = async (request, response) => {
    const webHookReq = request.body
    const tag = webHookReq.fulfillmentInfo.tag;
    let text = '';

    console.log('fulfillmentInfo:', webHookReq.fulfillmentInfo);
    console.log('sessionInfo:', webHookReq.sessionInfo);
    console.log('pageInfo:', webHookReq.pageInfo);
    console.log('intentInfo:', webHookReq.intentInfo);


    if (tag in TAG_MAPPING) {
        text = await TAG_MAPPING[tag].call(this, )
    } else {
        text = `There are no fulfillment responses defined for "${tag} tag`;
    }

    const jsonResponse = {
        fulfillment_response: {
            messages: [
                {
                    text: {
                        //fulfillment text response to be sent to the agent
                        text: [text],
                    },
                },
            ],
        },
    };

    response.send(jsonResponse);
}

functions.http('riDfWebHook', riDfWebHook);

// const main = async () => {
//     return await listEntityTypes('product-type');
// }
//
// main()
//     .then( r => console.log(r))
//     .catch( e=> console.log(e))