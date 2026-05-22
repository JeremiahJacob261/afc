import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers'
import { supabase } from './supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async  function handler(req, res) {
    const body = req.body;
    const scratch = async (home, away, chome, caway, check, matchid) => {
        let resluts = home + " - " + away;
        let ceslut = chome + " - " + caway;
        try {
            //function for rewardng uplines
    
            const reward = async (username, amount,profit) => { 
                const Reads = async (dtype, damount) => {
                    const { data, error } = await supabase
                        .rpc(dtype, { amount: damount })
                    console.log(error);
                }
                Reads('readwon', profit);
                const NUser = async (reason, username, amount) => {
                    const { error } = await supabase
                        .from('activa')
                        .insert({
                            'code': reason,
                            'username': username,
                            'amount': amount,
                            'type': 'rebate'
                        });
                }
                            const reward_upline = async () => {
                                console.log('rewarding uplines..');
                                try {
                                    const AffBonus = async (damount, dusername, refer, lvla, lvlb) => {
                                        try {
                                            const { data, error } = await supabase
                                                .rpc('affbonus', { name: dusername, type: 'affbonus', amount: damount, refers: refer, lvls: lvla, lvlss: lvlb })
                                            console.log(error, 'affbonus');
                                        } catch (e) {
                                            console.log(e, 'affbonus')
                                        }
                                
                                    }
                                    const { data, error } = await supabase
                                        .from('users')
                                        .select('*')
                                        .eq('username', username);
                                    let aff = data[0];
                                    console.log(aff);
                                    AffBonus(parseFloat(profit), username, aff.refer, aff.lvla, aff.lvlb);
    
                                } catch (e) {
                                    console.log(e, 'reward upline');
                                }
                            }
                            NUser('bet', username, parseFloat(profit) + parseFloat(amount))
                            reward_upline();
            }
    
            //function for updating the bet of data
    
            const Verify = async (reslut, id) => {
                const { error } = await supabase
                    .from('bets')
                    .update({
                        'verified': true,
                        'results': reslut
                    })
                    .eq('match_id', id);
                console.log(error);
            }
    
            //function for updating the bet of those who truely won or lost
    
            const losersetwinners = async (reslut,matchid) => {
                const { data, error } = await supabase
                    .from('placed')
                    .select('*')
                    .eq('match_id',matchid);
                    console.log(data)
                    console.log(matchid)
                data.map((d) => {
                    console.log(d)
                    try {
                        if (d.market !== reslut) {
                            //protection
                            if (check) {
                                if(chome < 4 || caway < 4){
                                    if (d.market === ceslut) {
                                        const Chan = async () => {
                                            const { data, error } = await supabase
                                                .from('placed')
                                                .update({
                                                    'won': 'true'
                                                })
                                                .eq('betid', d.betid);
                                        }
                                        Chan();
        
                                        //function for updating the users balance
        
                                        const updateBalance = async () => {
                                            const { data, error } = await supabase
                                                .rpc('depositor', { amount:parseFloat(d.stake), names: d.username })
                                            console.log(error)
                                        }
                                        updateBalance();
                                    } else {
                                        //update bet data for users who lost
                                        const Chan = async () => {
                                            const { data, error } = await supabase
                                                .from('placed')
                                                .update({
                                                    'won': 'false'
                                                })
                                                .eq('betid', d.betid);
                                        }
                                        Chan();
                                    }
        
                                }else{
                                    if (d.market === 'Other') {
                                        const Chan = async () => {
                                            const { data, error } = await supabase
                                                .from('placed')
                                                .update({
                                                    'won': 'true'
                                                })
                                                .eq('betid', d.betid);
                                        }
                                        Chan();
        
                                        //function for updating the users balance
        
                                        const updateBalance = async () => {
                                            const { data, error } = await supabase
                                                .rpc('depositor', { amount:parseFloat(d.stake), names: d.username })
                                            console.log(error)
                                        }
                                        updateBalance();
                                    } else {
                                        //update bet data for users who lost
                                        const Chan = async () => {
                                            const { data, error } = await supabase
                                                .from('placed')
                                                .update({
                                                    'won': 'false'
                                                })
                                                .eq('betid', d.betid);
                                        }
                                        Chan();
                                    }
        
                                }
                            } else {
                                const Chan = async () => {
                                    const { data, error } = await supabase
                                        .from('placed')
                                        .update({
                                            'won': 'true'
                                        })
                                        .eq('betid', d.betid);
                                }
                                Chan();
                                reward(d.username, d.stake,d.profit);
                                //function for updating the users balance
    
                                const updateBalance = async () => {
                                    const { data, error } = await supabase
                                        .rpc('depositor', { amount: parseFloat(d.aim) + parseFloat(d.stake), names: d.username })
                                    console.log(error)
                                }
                                updateBalance();
                            }
                        } else {
                            const Chan = async () => {
                                const { data, error } = await supabase
                                    .from('placed')
                                    .update({
                                        'won': 'true'
                                    })
                                    .eq('betid', d.betid);
                                    reward(d.username, d.stake,d.profit);
                            }
                            Chan();
                        }
                    } catch (e) {
                        console.log(e)
                    }
                })
            }
    
            //function for updating the bet of those who are under protection
            const protect = async () => {
    
            }
    
            //main logic
            if (home < 4 || away < 4) {
                losersetwinners(resluts,matchid);
                Verify(resluts, matchid);
                res.status(200).json({'STATUS':'SUCCESS'});    
                
            } else {
                Verify('Other', matchid);
                losersetwinners(resluts,matchid);
                res.status(200).json({'STATUS':'SUCCESS'});
    
            }
        } catch (e) {
            console.log(e)
            res.status(500).json({'STATUS':'ERROR'});
            
        }
    }
scratch(body.home,body.away,body.chome,body.caway,body.check,body.matchid)
}