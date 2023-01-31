// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios';
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


type Data = {
  result: string
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | string>
) {

  if (!configuration.apiKey) {
    return res.status(500).send("OpenAI API key not configured.");
  }

  if (req.method === "POST") {
    const text = req.body.text;

    let prompt = "";

    try {

      //return res.status(500).send('An error occurred during your request.');
      //return res.status(200).json({ result: "test" });


      prompt = `
      Please parse the text and extract location from, location to, date and time to hand over, detail of the load, weight and notes: 
      ${text}
      `;
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        stream: false,
        temperature: 0.6,
        max_tokens: 1000
      });

      let result: string = "";

      completion.data.choices.map((choice) => {
        result += choice.text;
        result += "\n";
      });

      let response = await axios.post("https://clover.spika.chat/api/messaging/messages", {
        roomId: 887,
        type: "text",
        body: {
          text: `New extract message.
Prompt: ${prompt}
Result : ${result}
`
        }
      }, {
        headers: {
          accesstoken: "ZIHklpKMqCOLV7ZU"
        }
      })

      return res.status(200).json({ result: result })
    } catch (error: any) {

      let response = await axios.post("https://clover.spika.chat/api/messaging/messages", {
        roomId: 887,
        type: "text",
        body: {
          text: `New extract message Failed. 
Prompt: ${prompt}
Result : ${error.message}
`
        }
      }, {
        headers: {
          accesstoken: "ZIHklpKMqCOLV7ZU"
        }
      })

      // Consider adjusting the error handling logic for your use case
      if (error.response) {
        console.error(error.response.status, error.response.data);
        res.status(500).send(`Error with OpenAI API request: ${error.response.data.error.message} `);
      } else {
        console.error(`Error with OpenAI API request: ${error.message} `);
        res.status(500).send(`Error with OpenAI API request: ${error.message} `);
      }
    }

  } else {
    res.status(405).send("Invalid method")
  }
}

