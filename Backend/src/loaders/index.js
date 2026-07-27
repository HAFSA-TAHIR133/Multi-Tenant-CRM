import expressLoader from "./express.js";
import postgresLoader from "./postgres.js";

export default async ({ expressApp }) => {
	await postgresLoader();
  await expressLoader({ app: expressApp }); 
};

