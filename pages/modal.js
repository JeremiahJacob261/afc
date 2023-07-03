import {  Paper} from '@mui/material'
import { Stack as Contain,Typography} from '@mui/material'
import PropTypes from 'prop-types';
import {Button,Modal} from 'react-bootstrap'
import { useRouter } from 'next/router'

export default function SimpleDialog(props) {
  const router = useRouter()
  const { onClose, selectedValue, open } = props;

  const handleClose = () => {
    onClose(selectedValue);
    router.push("/user")
  };

  return (
      <Modal show={open} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>ATALANTA Football Club</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Paper elevation={3} style={{padding:"10px",backgroundColor:"#F4F3EE"}} >
            <Typography align="center" style={{padding:"4px"}} >Welcome to ATALANTA Football Club,where you can get 
            the best Odds in the European Betting Market
            </Typography>
          </Paper>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleClose}>
                Ok
          </Button>
        </Modal.Footer>
      </Modal>
  );
}

SimpleDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};
