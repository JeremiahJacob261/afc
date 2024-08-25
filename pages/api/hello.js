// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  var s = "CCB";
  let splinter = s.split("");
  var spn = splinter.length ** splinter.length;
  console.log(splinter)
  var allcombinations = [];
  for(let i = 0; i < 3; i++){
   
   allcombinations.push(splinter[i % 3] + splinter[allcombinations.length % 2]);
   
    
  }
  for(let i = 0; i < 3; i++){
   
    allcombinations.push(splinter[allcombinations.length % 1] + splinter[allcombinations.length % 2] + splinter[allcombinations.length % 3]);
   
   }

   for(let i = 0; i < 3; i++){
   
    allcombinations.push(splinter[allcombinations.length % 3]);
     
     
   }
    console.log(allcombinations);
    //3,2,1,1,
  res.status(200).json({ name: 'John Doe' })
}
