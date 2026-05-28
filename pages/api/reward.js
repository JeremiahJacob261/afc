// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextResponse } from 'next/server';
import axios from 'axios';
import { headers } from 'next/headers'
import { supabase } from './supabase';
import { callInternalRpc } from '@/lib/serverRpc';
let apiKey = 'akpomoshi18+'; // your api key

function serializeError(error) {
    if (!error) return null;
    return {
        message: error.message || 'Unknown error',
        statusCode: error.statusCode || null,
        details: error.details || null,
        code: error.code || null,
    };
}

export default async function handler(req, res) {
    const body = req.body;
    let checked = body.checked;
    let reward = body.reward;
    let id = body.id;
    let password = body.password;
    let reason = body.reason;
    const parsedReward = Number(reward);
    const logContext = {
        recipient: id || null,
        amount: Number.isFinite(parsedReward) ? parsedReward : reward,
        amountType: typeof reward,
        notification: Boolean(checked),
    };
    const inBal = async () => {
        let error = null;
        console.log('[reward] depositor:start', logContext);
        try {
            await callInternalRpc(req, 'depositor', { amount: reward ?? 0, names: id })
            console.log('[reward] depositor:success', logContext);
        } catch (rpcError) {
            error = rpcError;
            console.error('[reward] depositor:error', {
                ...logContext,
                error: serializeError(rpcError),
            });
        }
        if (checked) {
            console.log('[reward] notification:start', logContext);
            const { data: nata, error: nerror } = await supabase
                .from('notification')
                .insert({
                    'username': id,
                    'amount': reward ?? 0,
                    'type': 'deposit',
                    'method': reason ?? 'usdt',
                    'address': 'admin'
                })
            if (nerror) {
                console.error('[reward] notification:error', {
                    ...logContext,
                    error: serializeError(nerror),
                });
            } else {
                console.log('[reward] notification:success', logContext);
            }
        }
        if (error) {
            const serialized = serializeError(error);
            console.error('[reward] response:error', {
                ...logContext,
                error: serialized,
            });
            res.status(error.statusCode || 500).json({
                error: serialized?.message || 'Reward failed',
                statusCode: error.statusCode || 500,
                details: serialized?.details || null,
            });
        } else {
            console.log('[reward] response:success', logContext);
            res.status(200).json({ success: 'Successfully rewarded' });
        }
    }
    try {
        console.log('[reward] request:start', logContext);
        if (password != 'password') {
            console.warn('[reward] request:unauthorized', logContext);
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        await inBal();

    } catch (err) {
        const serialized = serializeError(err);
        console.error('[reward] request:error', {
            ...logContext,
            error: serialized,
        });
        res.status(err.statusCode || 500).json({
            error: serialized?.message || 'Reward failed',
            statusCode: err.statusCode || 500,
            details: serialized?.details || null,
        });
    }
}
