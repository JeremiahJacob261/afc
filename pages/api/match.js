// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
export default async function handler(req, res) {
  try {
    requireAdmin(req)
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' })
  }

  const body = req.body;
  const page = body.page;
  console.log(page, 'value of page');
  const date = new Date();
  let month = date.getMonth();
  let year = date.getFullYear();
  let day = date.getDate();
  let fullDate = `${year}-${(month + 1 > 11) ? 1 : month + 1}-${(day > 31) ? 1 : day}`;
  const supabase = getSupabaseAdmin()
  if (isNaN(page)) {
    console.log('a search bar was used');
    try {
      const { data, error } = await supabase
        .from('upcoming_matches')
        .select('*')
        .order('id', { ascending: false })
        console.log(error)
      // toLowerCase().includes(find.toLowerCase());
      let pager = body.page;
      console.log(data)
      try {
        const newList = data.filter((item) => item.home_name.toLowerCase().includes(pager.toLowerCase()) || item.away_name.toLowerCase().includes(pager.toLowerCase()));

        res.status(200).json(newList);
      } catch (e) {
        console.log(e)
        res.status(200).json({ "error": 'no match found' });
      }
    } catch (err) {
      console.log(err)
      res.status(500).json(err);
    }
  } else {
    console.log('a search bar was not used');
    try {
      const { data, error } = await supabase
        .from('upcoming_matches')
        .select('home_name,away_name,id,hour,minute,day,month,league')
      let upcomingMatches = data;
      // function splitIntoChunks(arr, chunkSize) {
      //   let result = [];
      //   while (arr.length > 0) {
      //     let chunk = arr.splice(0, chunkSize);
      //     result.push(chunk);
      //   }
      //   return result;
      // }

      // let final = splitIntoChunks(upcomingMatches, 50)[page];

      res.status(200).json(upcomingMatches);
    } catch (err) {
      console.log(err)
      res.status(500).json(err);
    }
  }
}
