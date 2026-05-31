import { Stack, TextField } from "@mui/material"
import { Button } from "@mui/material"
import { useState } from "react"
import { useRouter } from 'next/router'
import { Icon } from "@iconify/react"
import { supabase } from "@/pages/api/supabase"
export default function Home({ id }) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    return (
        <div>
            <h1>Security: Reset User Password</h1>
            <p>still under testing</p>
            <Stack direction="column" spacing={2}>
                <TextField
                    value={amount}
                    onChange={(s) => {
                        setAmount(s.target.value);
                        if (isNaN(s.target.value)) {
                            // setAmount('');
                        } else {
                            setAmount(s.target.value);

                        }
                    }}
                    variant="outlined"
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            "& .MuiOutlinedInput-root": {
                                "& > fieldset": {
                                    border: 'none'
                                }
                            },
                            "& input": {
                                color: 'white'
                            }
                        }
                    }}
                    placeholder="Amount"
                    sx={{
                        "& .MuiInputLabel-root": {
                            color: 'white'
                        },
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                                border: 'none'
                            }
                        },
                        flex: 1,
                        letterSpacing: 2
                    }}
                />
                <TextField
                    value={reason}
                    onChange={(s) => {
                        setReason(s.target.value);
                    }}
                    variant="outlined"
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            "& .MuiOutlinedInput-root": {
                                "& > fieldset": {
                                    border: 'none'
                                }
                            },
                            "& input": {
                                color: 'white'
                            }
                        }
                    }}
                    placeholder="Reason for Reward"
                    sx={{
                        "& .MuiInputLabel-root": {
                            color: 'white'
                        },
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                                border: 'none'
                            }
                        },
                        flex: 1,
                        letterSpacing: 2
                    }}
                />
                <TextField
                    value={password}
                    onChange={(s) => {
                        setPassword(s.target.value);
                    }}
                    variant="outlined"
                    InputProps={{
                        disableUnderline: true,
                        sx: {
                            "& .MuiOutlinedInput-root": {
                                "& > fieldset": {
                                    border: 'none'
                                }
                            },
                            "& input": {
                                color: 'white'
                            }
                        }
                    }}
                    placeholder="Admin Password"
                    sx={{
                        "& .MuiInputLabel-root": {
                            color: 'white'
                        },
                        "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                                border: 'none'
                            }
                        },
                        flex: 1,
                        letterSpacing: 2
                    }}
                />
                <Stack className='rewardbtn' direction="row" justifyContent='center' alignItems='center' spacing={2}
                    onClick={async () => {
                        if (amount == '' || reason == '' || password == '') {
                            alert('Please fill in all fields');
                            return;
                        }
                        await fetch('/api/reward', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                reward: amount,
                                reason: reason,
                                password: password,
                                id: id
                            })
                        }).then((res) => {
                            if (res.status == 200) {
                                alert('Successfully rewarded');
                                setAmount('');
                                setReason('');
                                setPassword('');
                                router.push('/admin/dashboards');
                            } else {
                                alert(res.statusText);
                            }
                        })
                    }}>
                    <Icon icon="material-symbols-light:rewarded-ads" color="lavender" width={45} height={45} />
                    <p>Submit</p>
                </Stack>

            </Stack>
        </div>
    )
}
export async function getServerSideProps(context) {
    let id = context.query.id;
    const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('uid', id)
    if (error) {
        console.log(error);
    }
    return {
        props: {
            id: data[0].username
        },
    }
}