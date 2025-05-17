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

export async function addFeedback(  
  answer: string,
  rating: number,
  userId: string, 
  token: string,
  comment_feedback?: string,
) {

     try {
        comment_feedback = comment_feedback ?? 'sdasdasd';

        const response = await postToGateway(
            '/users/chat/feedback',
            {answer,comment_feedback,rating, userId  }      ,           
           token
            );
        return response.answer; 
  } catch (error) {
        throw new Error('Error connecting with IA');
    }
}
