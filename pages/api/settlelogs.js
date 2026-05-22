import { NextResponse } from 'next/server';
import { supabase } from '../../pages/api/supabase';
import { callInternalRpc } from '@/lib/serverRpc';
export default async function handler(req, res) {
    const body = req.body;
    const name = body.name;

    //guild functions (use backend RPC endpoints)
    const Depositing = async (damount, dusername) => {
        try {
            await callInternalRpc(req, 'depositor', { names: dusername, amount: damount })
        } catch (e) { console.log(e) }
    }

    const Chan = async (bets, type) => {
        try {
            await callInternalRpc(req, 'chan', { bet: bets, des: type })
        } catch (e) { console.log(e) }
    }

    const AffBonus = async (damount, dusername, refer, lvla, lvlb) => {
        try {
            await callInternalRpc(req, 'affbonus', { name: dusername, type: 'affbonus', amount: damount, refers: refer, lvls: lvla, lvlss: lvlb })
        } catch (e) { console.log(e) }
    }

    const NUser = async (reason, username, amount) => {
        const { error } = await supabase
            .from('activa')
            .insert({
                'code': reason,
                'username': username,
                'amount': amount
            });
    }
    //end of functions

    const GETbx = async () => {
        const { data, error } = await supabase
            .from('placed')
            .select('match_id,stake,aim,username,profit,market,betid')
            .match({ username: name, won: 'null' });


        //a for loop to get the match results
        await Promise.all(data.map(async (d) => {

            const { data: btx, error: bte } = await supabase
                .from('bets')
                .select('verified,results')
                .eq('match_id', d.match_id);
            if (btx[0].verified) {
                try {
                    if (d.market != btx[0].results) {
                        const { data: user, error: uerror } = await supabase
                            .from('users')
                            .select('refer,lvla,lvlb')
                            .eq('username', name);
                        Depositing(d.stake + d.aim, name);
                        Chan(d.betid, 'true');
                        AffBonus(parseFloat(d.profit), d.username, user.refer, user.lvla, user.lvlb);
                        NUser('bet', d.username, Number(d.aim) + Number(d.stake))
                    } else {
                        Chan(d.betid, 'false');
                    }
                    console.log('did')
                } catch (e) {
                    console.log(e)
                } finally {
                  
                }
            }
        }));
    }
    GETbx().then(() => {
     
        res.status(200).json({ message: 'success' });
    });
  
}
