import React, { Component } from 'react';
import { connect } from 'react-redux';
import { connectModal } from 'redux-modal';
import PropTypes from 'prop-types';
import moment from 'moment';
import axios from 'axios';
import Cookies from 'universal-cookie';
import { Button, Row, Col, Image, Card, Modal } from 'react-bootstrap';
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

  async initEvent() {
    try {
      const response = await axios.get(`${API_ROOT_URL}/api/v1/event_exports/${this.props.event.id}`,
        {
          headers: {
          authorization: cookies.get('token')
          }
        }      
      )
      this.setState({event: response.data});
    }
    catch(error) {
      console.log(error);
    };    
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`
  }

  handleImagePreviewModal(source, filepath) {
    this.props.showModal('imagePreview', { name: source, filepath: filepath })
  }

  renderImage(source, filepath) {
    return (
      <Card border="secondary" id={`image_${source}`}>
        <Card.Body className="data-card-body">
          <Image  fluid onError={this.handleMissingImage} src={filepath} onClick={ () => this.handleImagePreviewModal(source, filepath)} />
          <div>{source}</div>
        </Card.Body>
      </Card>
    )
  }

  renderImageryCard() {
    if(this.props.event && this.state.event.aux_data) { 
      if (this.state.event.event_value == "SuliusCam") {
        let tmpData =[]

        for (let i = 0; i < this.state.event.event_options.length; i++) {
          if (this.state.event.event_options[i].event_option_name == "filename") {
            tmpData.push({source: "SuliusCam", filepath: API_ROOT_URL + IMAGE_PATH + this.state.event.event_options[i].event_option_value} )
          } 
        }

        return (
          <Row>
            {
              tmpData.map((camera) => {
                return (
                  <Col key={camera.source} xs={12} sm={12} md={{span:8, offset:2}} lg={{span:8, offset:2}}>
                    {this.renderImage(camera.source, camera.filepath)}
                  </Col>
                )
              })
            }
          </Row>
        )
      } else {
        let frameGrabberData = this.state.event.aux_data.filter(aux_data => aux_data.data_source == 'vehicleRealtimeFramegrabberData')
        let tmpData = []

        if(frameGrabberData.length > 0) {
          for (let i = 0; i < frameGrabberData[0].data_array.length; i+=2) {
      
            tmpData.push({source: frameGrabberData[0].data_array[i].data_value, filepath: API_ROOT_URL + IMAGE_PATH + frameGrabberData[0].data_array[i+1].data_value} )
          }

          return (
            <Row>
              {
                tmpData.map((camera) => {
                  return (
                    <Col key={camera.source} xs={12} sm={6} md={6} lg={3}>
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

  renderNavLatLonCard() {

    let realtime_latitude = 'n/a'
    let realtime_longitude = 'n/a'

    let renav_latitude = 'n/a'
    let renav_longitude = 'n/a'

    let delta_latitude = 'n/a'
    let delta_longitude = 'n/a'

    if(this.props.event && this.state.event.aux_data) {
      let vehicleRealtimeNavData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData) {
        let xObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "latitude")
        realtime_latitude = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a'
        delta_latitude = (xObj)? `${parseFloat(xObj.data_value)}` : 'n/a'

        let yObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "longitude")
        realtime_longitude = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a'
        delta_longitude = (yObj)? `${parseFloat(yObj.data_value)}` : 'n/a'
      }
    }

    if(this.props.event && this.state.event.aux_data) {
      let vehicleReNavData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleReNavData")
      if(vehicleReNavData) {
        let xObj = vehicleReNavData.data_array.find(data => data.data_name == "latitude")
        renav_latitude = (xObj)? `${parseFloat(xObj.data_value).toFixed(6)} ${xObj.data_uom}` : 'n/a'
        delta_latitude = (xObj)? `${(delta_latitude - parseFloat(xObj.data_value)).toFixed(6)} ddeg` : 'n/a'

        let yObj = vehicleReNavData.data_array.find(data => data.data_name == "longitude")
        renav_longitude = (yObj)? `${parseFloat(yObj.data_value).toFixed(6)} ${yObj.data_uom}` : 'n/a'
        delta_longitude = (yObj)? `${(delta_longitude - parseFloat(yObj.data_value)).toFixed(6)} ddeg` : 'n/a'
      } else {
        delta_latitude = 'n/a'
        delta_longitude = 'n/a'
      }
    }


    return (
      <Col xs={12} sm={6} md={6} lg={3}>
        <Card border="secondary">
          <Card.Header className="data-card-header">Lat/Lng Coordinates</Card.Header>
          <Card.Body className="data-card-body">
            <strong>Realtime</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              Lat:<span className="float-right"> {`${realtime_latitude}`}</span><br/>
              Lng:<span className="float-right"> {`${realtime_longitude}`}</span><br/>
            </div>
            <strong>ReNav</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              Lat:<span className="float-right"> {`${renav_latitude}`}</span><br/>
              Lng:<span className="float-right"> {`${renav_longitude}`}</span><br/>
            </div>
            <strong>Delta</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              Lat:<span className="float-right"> {`${delta_latitude}`}</span><br/>
              Lng:<span className="float-right"> {`${delta_longitude}`}</span><br/>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  }

  renderNavAlvCoordCard() {

    let realtime_alvin_x = 'n/a'
    let realtime_alvin_y = 'n/a'

    let renav_alvin_x = 'n/a'
    let renav_alvin_y = 'n/a'

    let delta_alvin_x = 'n/a'
    let delta_alvin_y = 'n/a'

    if(this.props.event && this.state.event.aux_data) {
      let alvinRealtimeAlvinCoordData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeAlvinCoordData")
      if(alvinRealtimeAlvinCoordData) {
        let xObj = alvinRealtimeAlvinCoordData.data_array.find(data => data.data_name == "alvin_x")
        realtime_alvin_x = (xObj)? `${xObj.data_value} ${xObj.data_uom}` : 'n/a'
        delta_alvin_x = (xObj)? `${parseFloat(xObj.data_value)}` : 'n/a'

        let yObj = alvinRealtimeAlvinCoordData.data_array.find(data => data.data_name == "alvin_y")
        realtime_alvin_y = (yObj)? `${yObj.data_value} ${yObj.data_uom}` : 'n/a'
        delta_alvin_y = (yObj)? `${parseFloat(yObj.data_value)}` : 'n/a'
      }
    }

    if(this.props.event && this.state.event.aux_data) {
      let alvinReNavAlvinCoordData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleReNavAlvinCoordData")
      if(alvinReNavAlvinCoordData) {
        let xObj = alvinReNavAlvinCoordData.data_array.find(data => data.data_name == "alvin_x")
        renav_alvin_x = (xObj)? `${parseFloat(xObj.data_value).toFixed(2)} ${xObj.data_uom}` : 'n/a'
        delta_alvin_x = (xObj)? `${(delta_alvin_x - parseFloat(xObj.data_value)).toFixed(2)} meters` : 'n/a'

        let yObj = alvinReNavAlvinCoordData.data_array.find(data => data.data_name == "alvin_y")
        renav_alvin_y = (yObj)? `${parseFloat(yObj.data_value).toFixed(2)} ${yObj.data_uom}` : 'n/a'
        delta_alvin_y = (yObj)? `${(delta_alvin_y - parseFloat(yObj.data_value)).toFixed(2)} meters` : 'n/a'
      } else {
        delta_alvin_x = 'n/a'
        delta_alvin_y = 'n/a'
      }
    }

    return (
      <Col xs={12} sm={6} md={6} lg={3}>
        <Card border="secondary">
          <Card.Header className="data-card-header">Alvin Coordinates</Card.Header>
          <Card.Body className="data-card-body">
            <strong>Realtime</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              X:<span className="float-right"> {`${realtime_alvin_x}`}</span><br/>
              Y:<span className="float-right"> {`${realtime_alvin_y}`}</span><br/>
            </div>
            <strong>ReNav</strong><br/>
              <div style={{paddingLeft: "10px"}}>
              X:<span className="float-right"> {`${renav_alvin_x}`}</span><br/>
              Y:<span className="float-right"> {`${renav_alvin_y}`}</span><br/>
            </div>
            <strong>Delta</strong><br/>
              <div style={{paddingLeft: "10px"}}>
              X:<span className="float-right"> {`${delta_alvin_x}`}</span><br/>
              Y:<span className="float-right"> {`${delta_alvin_y}`}</span><br/>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  }

  renderAttitudeCard() {
    let depth = 'n/a'
    let alt = 'n/a'
    let hdg = 'n/a'
    let pitch = 'n/a'
    let roll = 'n/a'

    if(this.props.event && this.state.event.aux_data) {
      let vehicleRealtimeNavData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeNavData")
      if(vehicleRealtimeNavData) {
        let depthObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "depth")
        depth = (depthObj)? `${depthObj.data_value} ${depthObj.data_uom}` : 'n/a'

        let altObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "altitude")
        alt = (altObj)? `${altObj.data_value} ${altObj.data_uom}` : 'n/a'

        let hdgObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "heading")
        hdg = (hdgObj)? `${hdgObj.data_value} ${hdgObj.data_uom}` : 'n/a'

        let pitchObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "pitch")
        pitch = (pitchObj)? `${pitchObj.data_value} ${pitchObj.data_uom}` : 'n/a'

        let rollObj = vehicleRealtimeNavData.data_array.find(data => data.data_name == "roll")
        roll = (rollObj)? `${rollObj.data_value} ${rollObj.data_uom}` : 'n/a'

      }
    }  

    return (
      <Col xs={12} sm={6} md={6} lg={3}>
        <Card border="secondary">
          <Card.Header className="data-card-header">Vehicle Attitude</Card.Header>
          <Card.Body className="data-card-body">
            <strong>Realtime</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              Depth:<span className="float-right"> {`${depth}`}</span><br/>
              Alt:<span className="float-right"> {`${alt}`}</span><br/>
              Hdg:<span className="float-right"> {`${hdg}`}</span><br/>
              Pitch:<span className="float-right"> {`${pitch}`}</span><br/>
              Roll:<span className="float-right"> {`${roll}`}</span><br/>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  }

  renderSensorCard() {
    let ctd_data = null;
    let temp_probe_data = null;
    let mag_data = null;

    if(this.props.event && this.state.event.aux_data) {
      const vehicleCTDData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeCTDData")
      if(vehicleCTDData) {
        const ctd_cObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_c")
        const ctd_c = (ctd_cObj)? `${ctd_cObj.data_value} ${ctd_cObj.data_uom}` : 'n/a'

        const ctd_tObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_t")
        const ctd_t = (ctd_tObj)? `${ctd_tObj.data_value} ${ctd_tObj.data_uom}` : 'n/a'

        const ctd_dObj = vehicleCTDData.data_array.find(data => data.data_name == "ctd_d")
        const ctd_d = (ctd_dObj)? `${ctd_dObj.data_value} ${ctd_dObj.data_uom}` : 'n/a'

        ctd_data = (
          <Col sm={12} md={12}>
            <strong>CTD</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              C:<span className="float-right"> {`${ctd_c}`}</span><br/>
              T:<span className="float-right"> {`${ctd_t}`}</span><br/>
              D:<span className="float-right"> {`${ctd_d}`}</span><br/>
            </div>
          </Col>
        )
      }

      const vehicleTempProbeData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeTempProbeData")
      if(vehicleTempProbeData) {
        const temp_probeObj = vehicleTempProbeData.data_array.find(data => data.data_name == "ctd_c")
        const temp_probe = (temp_probeObj)? `${temp_probeObj.data_value} ${temp_probeObj.data_uom}` : 'n/a'

        temp_probe_data = (
          <Col sm={12} md={12}>
            <strong>Temp Probe</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              Temp:<span className="float-right"> {`${temp_probe}`}</span><br/>
            </div>
          </Col>
        )
      }

      const vehicleMagData = this.state.event.aux_data.find(aux_data => aux_data.data_source == "vehicleRealtimeMAGData")
      if(vehicleMagData) {
        const mag_xObj = vehicleMagData.data_array.find(data => data.data_name == "x-axis")
        const mag_x = (mag_xObj)? `${mag_xObj.data_value} ${mag_xObj.data_uom}` : 'n/a'

        const mag_yObj = vehicleMagData.data_array.find(data => data.data_name == "y-axis")
        const mag_y = (mag_yObj)? `${mag_yObj.data_value} ${mag_yObj.data_uom}` : 'n/a'

        const mag_zObj = vehicleMagData.data_array.find(data => data.data_name == "z-axis")
        const mag_z = (mag_zObj)? `${mag_zObj.data_value} ${mag_zObj.data_uom}` : 'n/a'

        mag_data = (
          <Col sm={12} md={12}>
            <strong>Magnetometer</strong><br/>
            <div style={{paddingLeft: "10px"}}>
              X:<span className="float-right"> {`${mag_x}`}</span><br/>
              Y:<span className="float-right"> {`${mag_y}`}</span><br/>
              Z:<span className="float-right"> {`${mag_z}`}</span><br/>
            </div>
          </Col>
        )
      }
    }

    return (ctd_data || temp_probe_data || mag_data)? (
      <Col xs={12} sm={6} md={6} lg={3}>
        <Card border="secondary">
          <Card.Header className="data-card-header">Sensor Data</Card.Header>
          <Card.Body className="data-card-body">
            <Row>
              {ctd_data}
              {temp_probe_data}
              {mag_data}
            </Row>
          </Card.Body>
        </Card>
      </Col>
    ):null
  }

  renderEventOptionsCard() {

    // return null;
    let return_event_options = this.state.event.event_options.reduce((filtered, event_option, index) => {
      if(event_option.event_option_name != 'event_comment') {
        filtered.push(<div key={`event_option_${index}`}><span>{event_option.event_option_name}:</span> <span style={{wordWrap:'break-word'}} >{event_option.event_option_value}</span><br/></div>);
      }
      return filtered
    },[])

    return (return_event_options.length > 0)? (
      <Col xs={12} sm={6} md={6} lg={3}>
        <Card border="secondary">
          <Card.Header className="data-card-header">Event Options</Card.Header>
          <Card.Body className="data-card-body">
            <div style={{paddingLeft: "10px"}}>
              {return_event_options}
            </div>
          </Card.Body>
        </Card>
      </Col>
    ) : null
  }

  render() {
    const { show, handleHide } = this.props

    const event_free_text_card = (this.state.event.event_free_text)? (<Card border="secondary"><Card.Body className="data-card-body">Text: {this.state.event.event_free_text}</Card.Body></Card>) : null;
    const event_comment = (this.state.event.event_options) ? this.state.event.event_options.find((event_option) => (event_option.event_option_name === 'event_comment' && event_option.event_option_value.length > 0)) : null

    const event_comment_card = (event_comment)?(<Card border="secondary"><Card.Body className="data-card-body">Comment: {event_comment.event_option_value}</Card.Body></Card>) : null;
    
    if(this.state.event.event_options) {
      return (
        <Modal size="lg" show={show} onHide={handleHide}>
            <ImagePreviewModal />
            <Modal.Header closeButton>
              <Modal.Title as="h5">Event Details: {this.state.event.event_value}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <span>User: {this.state.event.event_author}</span><br/>
              <span>Date: {this.state.event.ts}</span>
              <Row style={{paddingTop: "8px"}}>
                <Col xs={12}>
                  {this.renderImageryCard()}
                </Col>
              </Row>
              <Row style={{paddingTop: "8px"}}>
                {this.renderNavLatLonCard()}
                {this.renderNavAlvCoordCard()}
                {this.renderAttitudeCard()}
                {this.renderSensorCard()}
                {this.renderEventOptionsCard()}
              </Row>
              <Row style={{paddingTop: "8px"}}>
                <Col xs={12}>
                  {event_free_text_card}
                </Col>
              </Row>
              <Row style={{paddingTop: "8px"}}>
                <Col xs={12}>
                  {event_comment_card}
                </Col>
              </Row>
            </Modal.Body>
        </Modal>
      );
    } else {
      return (
        <Modal size="lg" show={show} onHide={handleHide}>
          <Modal.Header closeButton>
            <Modal.Title as="h5">Event Details: {this.state.event.event_value}</Modal.Title>
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
