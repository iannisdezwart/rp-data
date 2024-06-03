const main = async () => {
  const res = await fetch("http://localhost:3000/data", {
    method: "DELETE",
  });

  console.log(await res.json());
};

main();