import jwt from "jsonwebtoken";

const generarJWT = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

const generarId = () =>
  Math.random().toString(32).substring(2) + Date.now().toString(32);

export { generarJWT, generarId };
