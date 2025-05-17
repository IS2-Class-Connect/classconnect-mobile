import {
  postToGateway,
} from './gatewayClient';

export async function sendToAI(
    question: string,
    token: string
) {
     try {
        const response = await postToGateway(
            '/users/chat',
            {question},
            token
        );
        return response.answer; 
  } catch (error) {
        throw new Error('Error connecting with IA');
    }
}
