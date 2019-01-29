import React, { Component } from 'react';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button, Checkbox, Row, Col, Thumbnail, ControlLabel, ListGroup, ListGroupItem, FormGroup, FormControl, FormGroupItem, Modal, Well } from 'react-bootstrap';
import { connectModal } from 'redux-modal';
import { LinkContainer } from 'react-router-bootstrap';
import Datetime from 'react-datetime';
import moment from 'moment';
import ImagePreviewModal from './image_preview_modal';

import * as actions from '../actions';

import { API_ROOT_URL, IMAGE_PATH, ROOT_PATH } from '../client_config';

const cookies = new Cookies();

class EventShowDetailsModal extends Component {

  constructor (props) {
    super(props);

    this.state = { event: {} }

    this.handleImagePreviewModal = this.handleImagePreviewModal.bind(this);

  }

  static propTypes = {
    event: PropTypes.object.isRequired,
    handleHide: PropTypes.func.isRequired,
    handleUpdateEvent: PropTypes.func.isRequired
  };

  componentWillMount() {
    this.initEvent()
  }

  componentWillUnmount() {
  }

  initEvent() {
    axios.get(`${API_ROOT_URL}/api/v1/event_exports/${this.props.event.id}`,
      {
        headers: {
        authorization: cookies.get('token')
        }
      }      
    )
    .then((response) => {
      this.setState({event: response.data})
    })
    .catch((error) => {
      console.log(error);
    });
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`
  }

  handleImagePreviewModal(source, filepath) {
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  renderImage(source, filepath) {
    return (
      <Thumbnail onError={this.handleMissingImage} src={filepath} onClick={ () => this.handleImagePreviewModal(source, filepath)}>
        <div>{`${source}`}</div>
      </Thumbnail>
    )
  }

  renderImageryPanel() {
    if(this.props.event && this.state.event.aux_data) { 
      if (this.state.event.event_value == "SuliusCam") {
        let tmpData =[]

        for (let i = 0; i < this.state.event.event_options.length; i++) {
          if (this.state.event.event_options[i].event_option_name == "filename") {
            tmpData.push({source: "SuliusCam", filepath: API_ROOT_URL + IMAGE_PATH + '/SuliusCam/' + this.state.event.event_options[i].event_option_value} )
          } 
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={12} sm={12} md={8} mdOffset={2} lg={8} lgOffset={2}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                )
              })
            }
          </Row>
        )
      } else {
        let frameGrabberData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == 'framegrabber')
        let tmpData = []

        if(frameGrabberData.length > 0) {
          for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
      
            tmpData.push({source: frameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + '/' + frameGrabberData[0].data_array[i+1].data_value.split('/').pop()} )
          }

          return (
            <Row>
              {
                tmpData.map((camera) => {
                  return (
                    <Col key={camera.source} xs={12} sm={6} md={3} lg={3}>
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
  }

  // renderSciCamPanel() {
  //   if(this.props.event && this.state.event.event_value == 'SCICAM') {

  //     let sciCamData = this.state.event.event_options.filter(event_option => event_option.event_option_name == 'filepath')

  //     if(sciCamData.length > 0) {
  //       return (
  //         <Row>
  //           <Col key='sciCamImage' xs={6} sm={6} md={3} lg={3}>
  //             {this.renderImage("SciCAM", IMAGE_PATH + '/SCICAM_Images/' + sciCamData[0].event_option_value.split('/').pop())}
  //           </Col>
  //         </Row>
  //       )
  //     }
  //   }
  // }

  renderNavLatLonPanel() {

    let latitude = 'n/a'
    let longitude = 'n/a'
    let depth = 'n/a'
    let altitude = 'n/a'

    if(this.props.event && this.state.event.aux_data) {
      let vehicleRealtimeNavData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData.length > 0) {
        let latObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "latitude")
        latitude = (latObj.length > 0)? `${latObj[0].data_value} ${latObj[0].data_uom}` : 'n/a'

        let lonObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "longitude")
        longitude = (lonObj.length > 0)? `${lonObj[0].data_value} ${lonObj[0].data_uom}` : 'n/a'

        let depthObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "depth")
        depth = (depthObj.length > 0)? `${depthObj[0].data_value} ${depthObj[0].data_uom}` : 'n/a'

        let altObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "altitude")
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
      let alvinRealtimeAlvinCoordData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
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
      let vehicleRealtimeNavData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData.length > 0) {
        let hdgObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "heading")
        hdg = (hdgObj.length > 0)? `${hdgObj[0].data_value} ${hdgObj[0].data_uom}` : 'n/a'

        let pitchObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "pitch")
        pitch = (pitchObj.length > 0)? `${pitchObj[0].data_value} ${pitchObj[0].data_uom}` : 'n/a'

        let rollObj = vehicleRealtimeNavData[0].data_array.filter(data => data.data_name == "roll")
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
    let event_free_text = (this.state.event.event_free_text)? (<ListGroup><ListGroupItem>Text: {this.state.event.event_free_text}</ListGroupItem></ListGroup>) : null;
    let event_comment = null;

    if(this.state.event.event_options) {

      eventOptionsArray = this.state.event.event_options.reduce((filtered, option) => {
        if (option.event_option_name == 'event_comment') {
          event_comment = (<ListGroup><ListGroupItem>Comment: {option.event_option_value}</ListGroupItem></ListGroup>);
        } else {
          filtered.push(<ListGroupItem key={`option_${option.event_option_name}`}>{`${option.event_option_name}: "${option.event_option_value}"`}</ListGroupItem>);
        }
        return filtered
      }, [])
      
              // <Row>
                // <Col xs={12}>
                  // {this.renderSciCamPanel()}
                // </Col>
              // </Row>

      return (
        <Modal bsSize="large" show={show} onHide={handleHide}>
            <ImagePreviewModal />;
            <Modal.Header closeButton>
              <Modal.Title>Event Details: {this.state.event.event_value}</Modal.Title>
              Date: {this.state.event.ts}<br/>
              User: {this.state.event.event_author}
            </Modal.Header>

            <Modal.Body>
              <Row>
                <Col xs={12}>
                  {this.renderImageryPanel()}
                </Col>
              </Row>
              <Row>
                <Col xs={12} sm={6} md={3} lg={3}>
                  {this.renderNavLatLonPanel()}
                </Col>
                <Col xs={12} sm={6} md={3} lg={3}>
                  {this.renderNavAlvCoordPanel()}
                </Col>
                <Col xs={12} sm={6} md={3} lg={3}>
                  {this.renderAttitudePanel()}
                </Col>
                <Col xs={12} sm={6} md={3} lg={3}>
                  <ListGroup>
                    {eventOptionsArray}
                  </ListGroup>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  {event_free_text}
                </Col>
                <Col xs={12}>
                  {event_comment}
                </Col>
              </Row>
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
  }

}

EventShowDetailsModal = connect(
  mapStateToProps, actions
)(EventShowDetailsModal)

export default connectModal({ name: 'eventShowDetails', destroyOnHide: true })(EventShowDetailsModal)
