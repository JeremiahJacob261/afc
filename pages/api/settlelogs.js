import { NextResponse } from 'next/server';
import { supabase } from '../../pages/api/supabase';
export default async function handler(req, res) {
    const body = req.body;
    const name = body.name;

    //guild functions
    const Depositing = async (damount, dusername) => {
        const { data, error } = await supabase
            .rpc('depositor', { amount: damount, names: dusername })
        console.log(error);
    }

    const Chan = async (bets, type) => {
        const { data, error } = await supabase
            .rpc('chan', { bet: bets, des: type })
        console.log(error);
    }

    const AffBonus = async (damount, dusername, refer, lvla, lvlb) => {
        try {
            const { data, error } = await supabase
                .rpc('affbonus', { name: dusername, type: 'affbonus', amount: damount, refers: refer, lvls: lvla, lvlss: lvlb })
            console.log(error);
        } catch (e) {
            console.log(e)
        }

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
        data.map(async (d) => {

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
        });
    }
    GETbx().then(() => {
     
        res.status(200).json({ message: 'success' });
    });
  
}