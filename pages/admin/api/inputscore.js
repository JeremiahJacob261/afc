// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers'
import { supabase } from './supabase';
let apiKey = 'akpomoshi18+'; // your api key
export default async function handler(req, res) {
    const body = req.body;
    let home = body.home;
    let away = body.away;
    let chome = body.chome;
    let caway = body.caway;
    let matchid = body.matchid;
    let check = body.check;
    //all jargons


    const Reads = async (dtype, damount) => {
        const { data, error } = await supabase
            .rpc(dtype, { amount: damount })
        console.log(error);
    }
    const Chan = async (bets, type) => {
        console.log(type)
        const { data, error } = await supabase
            .from('placed')
            .update({
                'won': type
            })
            .eq('betid', bets);
        console.log(error, bets);
    }
    const AffBonus = async (damount, dusername, refer, lvla, lvlb) => {
        try {
            const { data, error } = await supabase
                .rpc('affbonus', { name: dusername, type: 'affbonus', amount: damount, refers: refer, lvls: lvla, lvlss: lvlb })
            console.log(error, 'affbonus');
        } catch (e) {
            console.log(e, 'affbonus')
        }

    }

    const Bspend = async (amount, name) => {
        const { data, error } = await supabase
            .rpc('betterspend', { amount: amount, names: name })
        console.log(error)
    }
    const Bwon = async (amount, name) => {
        const { data, error } = await supabase
            .rpc('betterwon', { amount: amount, names: name })
        console.log(error)
    }

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
    //funct6ions
    // async function funct(reslut, id) {
    //     const { data, error } = await supabase.functions.invoke('hello-world', {
    //         body: {
    //             match: id,
    //             reslut: reslut
    //         },
    //     })
    //     console.log(data)
    //     console.log(error)
    // }

    //verify if the user has won the bet
    const Verify = async (reslut, id) => {
        console.log('Verifying...')
        const { error } = await supabase
            .from('bets')
            .update({
                'verified': true,
                'results': reslut
            })
            .eq('match_id', id);
        console.log(error);
        let market = reslut;
        const updateBalance = async (id, market) => {
            console.log('updating balance...', market);
            const { data, error } = await supabase
                .from('placed')
                .select('*')
                .match({
                    'match_id': id
                });
            for (let i = 0; i < data.length; i++) {
                let d = data[i];
                console.log(i);
                console.log(d.market, market);
                if (d.market === market) {
                    console.log(d.market, market);
                    const Chan = async () => {
                        console.log('type')
                        const { data, error } = await supabase
                            .from('placed')
                            .update({
                                'won': 'true'
                            })
                            .eq('betid', d.betid);
                    }
                    Chan();
                    console.log((d.market === market) ? 'true' : 'false');
                    const inBal = async () => {
                        const { data, error } = await supabase
                            .rpc('depositor', { amount: parseFloat(d.aim) + parseFloat(d.stake), names: d.username })
                        console.log(error)
                    }
                    Reads('readwon', d.aim)
                    inBal()
                    const reward_upline = async () => {
                        console.log('rewarding upline..');
                        try {

                            const { data, error } = await supabase
                                .from('users')
                                .select('*')
                                .eq('username', d.username);
                            let aff = data[0];
                            console.log(aff);
                            AffBonus(parseFloat(d.profit), d.username, aff.refer, aff.lvla, aff.lvlb);

                        } catch (e) {
                            console.log(e, 'reward upline');
                        }
                    }
                    NUser('bet', d.username, Number(d.aim) + Number(d.stake))
                    reward_upline();
                    Bwon(d.stake + d.aim, d.username);
                } else {
                    console.log('not equal', d.betid);
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

                Bspend(d.stake, d.username);

            }

        }

        updateBalance(id, reslut);
    }
    //verify if the bet is a company bet then retrn the stake to the user
    const VerifyN = async (reslut, id) => {
        console.log('VerifyingN...')
        let market = reslut;
        const updateBalance = async (id, market) => {
            const { data, error } = await supabase
                .from('placed')
                .select()
                .match(
                    {
                        'match_id': id,
                    }
                )
                for (let i = 0; i < data.length; i++) {
                    let d = data[i];
                    console.log(d);
                if (d.market != market) {
                    console.log(d);
                    const inBal = async () => {
                        const { data, error } = await supabase
                            .rpc('depositor', { amount: Number(d.stake), names: d.username })
                        console.log(error)
                    }
                    Reads('readwon', d.stake)
                    inBal()
                    Chan(d.betid, 'true');
                    Bwon(d.stake + d.aim, d.username);
                }
        }
        }
        updateBalance(id, market)
    }

    //end of functions
    //verify the bet
    if (home > 3 || away > 3) {

        if (check) {
            VerifyN('Other', matchid)
            Verify('Other', matchid);
            res.status(200).json({ 'STATUS': 'SUCCESS' });
        } else {
            Verify(home + " - " + away, matchid);
            res.status(200).json({ 'STATUS': 'SUCCESS' });
        }
    } else {
        if (check) {
            Verify(home + " - " + away, matchid);
            VerifyN(chome + " - " + caway, matchid)
            console.log(home + " - " + away)
            res.status(200).json({ 'STATUS': 'SUCCESS' });
        } else {
            // Verify(home + " - " + away, matchid)
            // console.log(home + " - " + away)
            Verify(home + " - " + away, matchid);
            res.status(200).json({ 'STATUS': 'SUCCESS' });
        }
    }
    //end of verify
    //end of all jargons
    // res.status(200).json({'SUCCESS':'SUCCESS'});
    // res.status(500).json({'ERROR':'ERROR'});

}