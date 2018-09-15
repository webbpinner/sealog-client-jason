import React, { Component } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, Modal, Grid, Row, Col } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import FontAwesome from 'react-fontawesome';
import ReactFileReader from 'react-file-reader';
import Cookies from 'universal-cookie';
import { API_ROOT_URL } from '../url_config';


const cookies = new Cookies();

class ImportCruisesModal extends Component {

  constructor (props) {
    super(props);

    this.state = {
      pending: 0,
      imported: 0,
      errors: 0,
      skipped: 0,
      quit: false,
    }

    this.handleHideCustom = this.handleHideCustom.bind(this);
  }

  handleHideCustom() {
    this.setState({quit: true})
    this.props.handleHide()
  }


  async insertCruise({ id, cruise_id, cruise_name, start_ts, stop_ts, cruise_description = '', cruise_location = '', cruise_pi, cruise_participants = [], cruise_tags = [], cruise_hidden = false}) {

    await axios.get(`${API_ROOT_URL}/api/v1/cruises/${id}`,
    {
      headers: {
        authorization: cookies.get('token'),
        'content-type': 'application/json'
      }
    })
    .then((response) => {

      // console.log("Cruise Already Exists");
      this.setState( prevState => (
        {
          skipped: prevState.skipped + 1,
          pending: prevState.pending - 1
        }
      ))
    })
    .catch((error) => {

      if(error.response.data.statusCode == 404) {
        // console.log("Attempting to add cruise")

        return axios.post(`${API_ROOT_URL}/api/v1/cruises`,
        { id, cruise_id, cruise_name, start_ts, stop_ts, cruise_description, cruise_location, cruise_pi, cruise_participants, cruise_tags, cruise_hidden},
        {
          headers: {
            authorization: cookies.get('token'),
            'content-type': 'application/json'
          }
        })
        .then((response) => {
          // console.log("Cruise Imported");
          this.setState( prevState => (
            {
              imported: prevState.imported + 1,
              pending: prevState.pending - 1
            }
          ))
          return true
        })
        .catch((error) => {
          
          if(error.response.data.statusCode == 400) {
            // console.log("Cruise Data malformed or incomplete");
          } else {
            console.log(error);  
          }
          
          this.setState( prevState => (
            {
              errors: prevState.errors + 1,
              pending: prevState.pending - 1
            }
          ))
          return false
        });
      } else {

        if(error.response.data.statusCode != 400) {
          console.log(error.response);
        }
        this.setState( prevState => (
          {
            errors: prevState.errors + 1,
            pending: prevState.pending - 1
          }
        ))
      }
    });
  }

  importCruisesFromFile = async (e) => {
    try {

      // console.log("processing file")
      let json = JSON.parse(e.target.result);
        this.setState( prevState => (
          {
            pending: json.length,
            imported: 0,
            errors: 0,
            skipped: 0
          }
        ))

      // console.log("done")
      let currentCruise;

      for(let i = 0; i < json.length; i++) {
        if (this.state.quit) {
          console.log("quiting")
          break;
        }
        currentCruise = json[i];
        // console.log("adding cruise")
        await this.insertCruise(currentCruise);
      }

    } catch (err) {
      console.log('error when trying to parse json = ' + err);
    }
  }

  handleCruiseRecordImport = files => {

    this.setState(
      {
        pending: "Calculating..."
      }
    )

    let reader = new FileReader();
    reader.onload = this.importCruisesFromFile
    reader.readAsText(files[0]);
  }

  render() {

    const { show } = this.props
    const options = {
      baseUrl: API_ROOT_URL,
      query: {
        warrior: 'fight'
      }
    }

    return (
      <Modal show={show} onHide={this.handleHideCustom}>
        <Modal.Header closeButton>
          <Modal.Title>Import Cruises</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Grid fluid>
            <Row>
              <Col xs={6}>
                <ReactFileReader fileTypes={[".json"]} handleFiles={this.handleCruiseRecordImport}>
                    <Button>Select File</Button>
                </ReactFileReader>
              </Col>
              <Col xs={4}>
                Pending: {this.state.pending}
                <hr/>
                Imported: {this.state.imported}<br/>
                Skipped: {this.state.skipped}<br/>
                Errors: {this.state.errors}<br/>
              </Col>
            </Row>
          </Grid>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={this.handleHideCustom}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default connectModal({ name: 'importCruises' })(ImportCruisesModal)