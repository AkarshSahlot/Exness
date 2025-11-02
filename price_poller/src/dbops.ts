import prisma from "./dbconfig";

// export async function processandSavetrade(params: any, price: any) {
//   try {
//     const data = await prisma.trade.create({
//       data: {
//         symbol: params.s,
//         price: price,
//         tradeId: BigInt(params.a),
//         timestamp: new Date(params.T),
//       },
//     });
//     console.log("data is updated :", data);
//   } catch (e) {
//     console.log(`error while pushing in the db ${e}`);
//   }
// }

export async function savetradeBatch(tradeBatch: any[]) {
  if (tradeBatch.length === 0) {
    return;
  }
  const res = await prisma.trade.createMany({
    data: tradeBatch,
    skipDuplicates: true,
  });
  console.log("Updated the batch <3 :" + res.count);
}
