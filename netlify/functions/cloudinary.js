require("dotenv").config();

exports.handler = async (event) => {};

exports.handler = async function (event, context) {
  const method = event.httpMethod;
  const { action } = event.queryStringParameters;

  if (method === "GET") {
    const exampleEnvVariable = process.env.EXAMPLE_ENV_VARIABLE;

    const search = event.queryStringParameters?.search || "none";
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Hello, Sagy! You searched for: ${search}`,
        envVariable: exampleEnvVariable,
      }),
    };
  }

  if (method === "POST") {
    const body = JSON.parse(event.body);
    // Do something with body
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Uploaded!", data: body }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Invalid request" }),
  };
};
