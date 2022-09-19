import {Firestore} from '@google-cloud/firestore'
import logger from 'npmlog'

const FIRESTORE_TICKETS_COLLECTION = 'tickets'


const firestore = new Firestore();

//createdDate
//createdBy
//updatedDate
//updatedBy
//product
//description
//status

export const createTicket = async (product, description, user) => {

    logger.info(`db create ticket, by:${user}...`);
    const data = {
        createdDate: Firestore.FieldValue.serverTimestamp(),
        updatedDate: Firestore.FieldValue.serverTimestamp(),
        product: product,
        description: description,
        status: 'CREATED'
    }

    if (user) {
        data['createdBy'] = user;
    }
    const result = await firestore.collection(FIRESTORE_TICKETS_COLLECTION).add(data);
    logger.info(`created ticket (${result.id})...`)
    return result.id;
};
