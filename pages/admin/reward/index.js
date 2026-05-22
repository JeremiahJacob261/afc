import { Stack, TextField, Checkbox } from "@mui/material"
import { Button } from "@mui/material"
import { useState } from "react"
import { useRouter } from 'next/router'
import { Icon } from "@iconify/react"
import { motion } from "framer-motion"
import { supabase } from "../api/supabase"
export default function Home({ id }) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    const [checked, setChecked] = useState(true);
    const [loading,setLoading] = useState(false);
    return (
        <div>
            <h1>Reward</h1>
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
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">

                    <Checkbox
                        checked={checked}
                        onChange={(e) => {
                            setChecked(e.target.checked)
                        }}
                        sx={{ color: "white" }}
                        inputProps={{ 'aria-label': 'controlled' }} />
                    <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '14px', fontWeight: '300' }}>Include reason for reward</p>
                </Stack>
                <motion.div whileHover={{ scale:1.1}} whileTap={{ scale : 0.7 }}>
                <Stack className='rewardbtn' direction="row" justifyContent='center' alignItems='center' spacing={2}
                    onClick={async () => {
                        setLoading(true);
                        if (amount == '' || reason == '' || password == '') {
                            alert('Please fill in all fields');
                            setLoading(false);
                            return;
                        }else{
                            await fetch('/api/reward', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    reward: amount,
                                    reason: reason,
                                    password: password,
                                    id: id,
                                    checked: checked
                                })
                            }).then((res) => {
                                if (res.status == 200) {
                                    alert('Successfully rewarded');
                                    setAmount('');
                                    setReason('');
                                    setPassword('');
                                    router.push('/admin/users');
                                } else {
                                    alert(res.statusText);
                                }
                            }).catch((err) => { 
                                console.log(err);
                            });
                            setLoading(false);
                        }
                       
                    }}>
                    <p>Submit</p>
                </Stack>
                </motion.div>
                
                {loading && <p>Loading...</p>}

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