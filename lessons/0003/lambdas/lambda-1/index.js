exports.handler = async (event) => {
  console.log("Olá da lambda");
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: false,
      echo: event || null,
      runtime: "nodejs20.x"
    })
  };
};