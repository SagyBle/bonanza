import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const { file } = JSON.parse(event.body); // file = base64 string

    const result = await cloudinary.v2.uploader.upload(file, {
      folder: "samples/ecommerce",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: result.secure_url }),
    };
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
