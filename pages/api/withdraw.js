import { NextResponse } from 'next/server';
import { supabase } from '../../pages/api/supabase';
export default async function handler(req, res) {
    const body = req.body;
    const rate = {
        'usdt': 1,
        'idr': 16255,
        'pkr': 279
    }
    const amountx = body.amount;
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .match({ 'username': body.name });
    console.log(data)
    const { data: bets, error: err } = await supabase
        .from('placed')
        .select('*')
        .eq('username', body.name)
    if (body.name === "Hamza98") {
        res.status(200).json([{ 'status': 'Failed', 'message': 'Wrong password' }]);
    } else {

        if (bets.length > 4) {
            if (!data[0].codeset) {

                console.log('no transaction pin has been set')
                res.status(200).json([{ 'status': 'Failed', 'message': 'No transaction pin has been set' }]);
            } else if (data[0].pin != body.pass) {
                console.log('wrong password')

                res.status(200).json([{ 'status': 'Failed', 'message': 'Wrong password' }]);
            } else if (data[0].balance < body.amount) {
                console.log('insufficient funds')
                res.status(200).json([{ 'status': 'Failed', 'message': 'Insufficient funds' }]);

            } else if (body.amount > body.vipamount || parseFloat((parseFloat(body.amount) + parseFloat(data[0].dailywl)).toFixed(2)) > body.vipamount) {
                console.log('Amount exceeds daily withdrawal limit')
                res.status(200).json([{ 'status': 'Failed', 'message': 'Amount exceeds daily withdrawal limit' }]);

            } else {
                const { error } = await supabase
                    .from('notification')
                    .insert({ address: body.wallet, username: body.name, amount: parseFloat(body.amount) * 0.93, sent: 'pending', type: "withdraw", method: body.method, bank: body.bank, accountname: body.accountname })
                try {

                    const { data, error } = await supabase
                        .rpc('dailywl', { amount: amountx, names: body.name })
                } catch (e) {
                    console.log(e)
                }
                try {

                    const { data, error } = await supabase
                        .rpc('withdrawer', { amount: amountx, names: body.name })
                } catch (e) {
                    console.log(e)
                }
                console.log('Success')
                res.status(200).json([{ 'status': 'Success', 'message': 'Withdrawal Request as been sent' }]);
                //08125733375
            }
            if (error) {
                console.log(error);
                return;
            }
        } else {
            console.log('You have not placed up to 5 bets')
            res.status(200).json([{ 'status': 'Failed', 'message': 'You have not placed up to 5 bets' }]);
        }

    }
}