import React, { Component } from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Checkbox, Grid, Row, Col, Thumbnail, ControlLabel, ListGroup, ListGroupItem, FormGroup, FormControl, FormGroupItem, Modal, Well } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import { LinkContainer } from 'react-router-bootstrap';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import moment from 'moment';
import * as actions from '../actions';

import { API_ROOT_URL, IMAGE_PATH } from '../url_config';

const cookies = new Cookies();

class EventShowDetailsModal extends Component {

  constructor (props) {
    super(props);

    this.state = { event: {} }
  }

  static propTypes = {
    id: PropTypes.string.isRequired,
    handleHide: PropTypes.func.isRequired,
  };

  componentWillMount() {
    axios.get(`${API_ROOT_URL}/api/v1/event_exports/${this.props.id}`,
      {
        headers: {
        authorization: cookies.get('token')
        }
      }      
    )
    .then((response) => {
      // console.log("response:", response.data)
      this.setState({event: response.data})
    })
    .catch((error) => {
      console.log(error);
    });
  }

  componentWillUnmount() {
  }

  handleMissingImage(ev) {
    ev.target.src = `images/noimage.jpeg`
  }

  renderImage(source, filepath) {
    return (
      <Thumbnail onError={this.handleMissingImage} src={filepath}>
        <div>{`${source}`}</div>
      </Thumbnail>
    )
  }

  renderImageryPanel() {
    if(this.props.event && this.state.event.aux_data) {

      let alvinFrameGrabberData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == 'framegrabber')
      let tmpData = []

      if(alvinFrameGrabberData.length > 0) {
        for (let i = 0; i < alvinFrameGrabberData[0].data_array.length; i+=2) {
    
          tmpData.push({source: alvinFrameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + '/' + alvinFrameGrabberData[0].data_array[i+1].data_value.split('/').pop()} )
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={6} sm={6} md={3} lg={3}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                )
              })
            }
          </Row>
        )
      }
    }
  }

  renderSciCamPanel() {
    if(this.props.event && this.state.event.event_value == 'SCICAM') {

      let sciCamData = this.state.event.event_options.filter(event_option => event_option.event_option_name == 'filepath')

      if(sciCamData.length > 0) {
        return (
          <Row>
            <Col key='sciCamImage' xs={6} sm={6} md={3} lg={3}>
              {this.renderImage("SciCAM", IMAGE_PATH + '/SCICAM_Images/' + sciCamData[0].event_option_value.split('/').pop())}
            </Col>
          </Row>
        )
      }
    }
  }

  renderNavLatLonPanel() {

    let latitude = 'n/a'
    let longitude = 'n/a'
    let depth = 'n/a'
    let altitude = 'n/a'

    if(this.props.event && this.state.event.aux_data) {
      let alvinRealtimeNavData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == "alvinRealtimeNavData")
      if(alvinRealtimeNavData.length > 0) {
        let latObj = alvinRealtimeNavData[0].data_array.filter(data => data.data_name == "latitude")
        latitude = (latObj.length > 0)? `${latObj[0].data_value} ${latObj[0].data_uom}` : 'n/a'

        let lonObj = alvinRealtimeNavData[0].data_array.filter(data => data.data_name == "longitude")
        longitude = (lonObj.length > 0)? `${lonObj[0].data_value} ${lonObj[0].data_uom}` : 'n/a'

        let depthObj = alvinRealtimeNavData[0].data_array.filter(data => data.data_name == "depth")
        depth = (depthObj.length > 0)? `${depthObj[0].data_value} ${depthObj[0].data_uom}` : 'n/a'

        let altObj = alvinRealtimeNavData[0].data_array.filter(data => data.data_name == "altitude")
        altitude = (altObj.length > 0)? `${altObj[0].data_value} ${altObj[0].data_uom}` : 'n/a'

      }
    }  

    return (
      <ListGroup>
        <ListGroupItem>Lat:<span className="pull-right">{`${latitude}`}</span></ListGroupItem>
        <ListGroupItem>Lng:<span className="pull-right">{`${longitude}`}</span></ListGroupItem>
        <ListGroupItem>Depth:<span className="pull-right">{`${depth}`}</span></ListGroupItem>
        <ListGroupItem>Alt:<span className="pull-right">{`${altitude}`}</span></ListGroupItem>
      </ListGroup>
    );
  }

  renderNavAlvCoordPanel() {

    let alvin_x = 'n/a'
    let alvin_y = 'n/a'
    let alvin_z = 'n/a'

    if(this.props.event && this.state.event.aux_data) {
      let alvinRealtimeAlvinCoordData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == "alvinRealtimeNavData")
      if(alvinRealtimeAlvinCoordData.length > 0) {
        let xObj = alvinRealtimeAlvinCoordData[0].data_array.filter(data => data.data_name == "alvin_x")
        alvin_x = (xObj.length > 0)? `${xObj[0].data_value} ${xObj[0].data_uom}` : 'n/a'

        let yObj = alvinRealtimeAlvinCoordData[0].data_array.filter(data => data.data_name == "alvin_y")
        alvin_y = (yObj.length > 0)? `${yObj[0].data_value} ${yObj[0].data_uom}` : 'n/a'

        let zObj = alvinRealtimeAlvinCoordData[0].data_array.filter(data => data.data_name == "alvin_z")
        alvin_z = (zObj.length > 0)? `${zObj[0].data_value} ${zObj[0].data_uom}` : 'n/a'

      }
    }

    return (
      <ListGroup>
        <ListGroupItem>X:<span className="pull-right">{`${alvin_x}`}</span></ListGroupItem>
        <ListGroupItem>Y:<span className="pull-right">{`${alvin_y}`}</span></ListGroupItem>
        <ListGroupItem>Z:<span className="pull-right">{`${alvin_z}`}</span></ListGroupItem>
      </ListGroup>
    );
  }

  renderAttitudePanel() {
    let hdg = 'n/a'
    let pitch = 'n/a'
    let roll = 'n/a'

    if(this.props.event && this.state.event.aux_data) {
      let alvinRealtimeNavData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == "alvinRealtimeNavData")
      if(alvinRealtimeNavData.length > 0) {
        let hdgObj = alvinRealtimeNavData[0].data_array.filter(data => data.data_name == "heading")
        hdg = (hdgObj.length > 0)? `${hdgObj[0].data_value} ${hdgObj[0].data_uom}` : 'n/a'

        let pitchObj = alvinRealtimeNavData[0].data_array.filter(data => data.data_name == "pitch")
        pitch = (pitchObj.length > 0)? `${pitchObj[0].data_value} ${pitchObj[0].data_uom}` : 'n/a'

        let rollObj = alvinRealtimeNavData[0].data_array.filter(data => data.data_name == "roll")
        roll = (rollObj.length > 0)? `${rollObj[0].data_value} ${rollObj[0].data_uom}` : 'n/a'

      }
    }  

    return (
      <ListGroup>
        <ListGroupItem>Hdg:<span className="pull-right">{`${hdg}`}</span></ListGroupItem>
        <ListGroupItem>Pitch:<span className="pull-right">{`${pitch}`}</span></ListGroupItem>
        <ListGroupItem>Roll:<span className="pull-right">{`${roll}`}</span></ListGroupItem>
      </ListGroup>
    );
  }

  render() {
    const { show, handleHide } = this.props

    let eventOptionsArray = [];

    if(this.state.event.event_options) {

      // console.log("selected event:", this.state.event)
      this.state.event.event_options.map((option) => {
        if (option.event_option_name != 'event_comment') {
          eventOptionsArray.push(option.event_option_name.replace(/\s+/g, "_") + ": \"" + option.event_option_value + "\"");
        }
      })
      
      if (this.state.event.event_free_text) {
        eventOptionsArray.push("text: \"" + this.state.event.event_free_text + "\"")
      } 

      let eventOptions = (eventOptionsArray.length > 0)? '--> ' + eventOptionsArray.join(', '): ''

      return (
        <Modal bsSize="large" show={show} onHide={handleHide}>
            <Modal.Header closeButton>
              <Modal.Title>Event Details</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <Grid>
                <Row>
                  <Col xs={12} sm={9} md={11} lg={9}>
                    {this.renderImageryPanel()}
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={11}>
                    {this.renderSciCamPanel()}
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={9} md={11} lg={9}>
                    <Grid fluid>
                      <Row>
                        <Col xs={6} sm={6} md={3} lg={3}>
                          {this.renderNavLatLonPanel()}
                        </Col>
                        <Col xs={6} sm={6} md={3} lg={3}>
                          {this.renderNavAlvCoordPanel()}
                        </Col>
                        <Col xs={6} sm={6} md={3} lg={3}>
                          {this.renderAttitudePanel()}
                        </Col>
                      </Row>
                    </Grid>
                  </Col>
                </Row>
                <Row>
                  <Col xs={12} sm={9} md={11} lg={9}>
                    {`${this.state.event.ts} <${this.state.event.event_author}>: ${this.state.event.event_value} ${eventOptions}`}
                  </Col>
                </Row>
              </Grid>
            </Modal.Body>
        </Modal>
      );
    } else {
      return (
        <Modal bsSize="large" show={show} onHide={handleHide}>
          <Modal.Header closeButton>
            <Modal.Title>Event Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Loading...
          </Modal.Body>
        </Modal>
      );
    }
  }
}

function mapStateToProps(state) {

  return {
    lowering: state.lowering.lowering,  
    roles: state.user.profile.roles,
    event: state.event
  }

}

EventShowDetailsModal = connect(
  mapStateToProps, actions
)(EventShowDetailsModal)

export default connectModal({ name: 'eventShowDetails', destroyOnHide: true })(EventShowDetailsModal)
