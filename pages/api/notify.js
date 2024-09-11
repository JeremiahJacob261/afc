// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import { supabase } from '../../pages/api/supabase';
export default async function handler(req, res) {
  const body = req.body;
  const name = body.name;

  const bonuscode = {
    'depbonus': 'You have received a deposit bonus',
    'affbonus': 'You have received an REBATE commission',
  };

  let datacontrol = [];
  //what we want to do here is that we want to push data into an array using a loop and then send it to the client
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('username', name);

  const newref = data[0].newrefer;
  //this is for just normal notifications

  //thi is for broadcasts to the users refer id
  const { data: getr, error: getrerror } = await supabase
    .from('activa')
    .select()
    .eq('code', newref)
    .order('id', { ascending: false });

  getr.map((item) => {
    let objectitem = {
      'message': `${bonuscode[item.type]} of ${parseFloat(item.amount).toFixed(4)} from ${item.username}`,
      'time': item.created_at,
    };
    datacontrol.push(objectitem);
  });

  //thi is for broadcasts
  const { data: getb, error: getberror } = await supabase
    .from('activa')
    .select()
    .eq('code', 'broadcast')
    .order('id', { ascending: false });

  getb.map((item) => {
    let objectitem = {
      'message': `${item.username}`,
      'time': item.created_at,
    };
    datacontrol.push(objectitem);
  });


  //thi is for some notifications we want to send to the user throught the username
  const { data: getu, error: getuerror } = await supabase
    .from('activa')
    .select()
    .match({ 'username': name, 'code': 'bet' })
    .order('id', { ascending: false });
  getu.map((item) => {
    let objectitem = {
      'message': `You have won your bet of ${parseFloat(item.amount).toFixed(2)} USDT`,
      'time': item.created_at,
    };
    datacontrol.push(objectitem);
  });
  //tis next part is for the notifications regarding transactions
  const { data:getx, error:getxerror } = await supabase
    .from('notification')
    .select()
    .eq('username', name)
    .neq('sent', 'pending')
    .order('id', { ascending: false });
    getx.map((item) => {
      let objectitem = {
        'message':`Your ${item.type} of ${parseFloat(item.amount).toFixed(2)} ${item.method} is ${item.sent}`,
        'time':item.time,
      };
      datacontrol.push(objectitem);
    });

     //tis next part is for the notifications regarding transactions bonus from admin
  const { data:getad, error:getaderror } = await supabase
  .from('notification')
  .select()
  .match({ 'username': name, 'address': 'admin' })
  .order('id', { ascending: false });
  getad.map((item) => {
    let objectitem = {
      'message':`You have received ${parseFloat(item.amount).toFixed(2)} USDT ${item.method} from admin`,
      'time':item.time,
    };
    datacontrol.push(objectitem);
  });
  // console.log(data)


  res.status(200).json(datacontrol);

}