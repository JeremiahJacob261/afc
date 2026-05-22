export default async function handler(req, res) {
    try{
       const data = await axios.get('https://v3.football.api-sports.io/{endpoint}",' , {param: req.body.param}, headers)
        res.status(200).json(data)
     } catch (error) {
        console.error(error)
        return res.status(error.status || 500).end(error.message)
      }}