import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Row, Col, Card, Image } from 'react-bootstrap';
import CustomPagination from './custom_pagination';
import * as actions from '../actions';
import { ROOT_PATH } from '../client_config';

let fileDownload = require('js-file-download');

const maxImagesPerPage = 16

class LoweringGalleryTab extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
    }

    this.handlePageSelect = this.handlePageSelect.bind(this);
  }

  static propTypes = {
    imagesSource: PropTypes.string.isRequired,
    imagesData: PropTypes.object.isRequired
  };

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleMissingImage(ev) {
    ev.target.src = `${ROOT_PATH}images/noimage.jpeg`
  }

  handleEventShowDetailsModal(event_id) {
    this.props.showModal('eventShowDetails', { event: { id: event_id } , handleUpdateEvent: this.props.updateEvent });
  }

  renderImage(source, filepath, event_id) {
    return (
      <Card border="secondary" style={{marginBottom: "8px"}} id={`image_${source}`}>
        <Card.Body className="data-card-body">
          <Image fluid onClick={ () => this.handleEventShowDetailsModal(event_id) } onError={this.handleMissingImage} src={filepath}/>
        </Card.Body>
      </Card>
    )
  }

  renderGallery(imagesSource, imagesData) {
    return imagesData.images.map((image, index) => {
      if(index >= (this.state.activePage-1) * maxImagesPerPage && index < (this.state.activePage * maxImagesPerPage)) {
        return (
          <Col key={`${imagesSource}_${image.event_id}`} xs={12} sm={6} md={4} lg={3}>
            {this.renderImage(imagesSource, image.filepath, image.event_id)}
          </Col>
        )
      }
    })
  }

  render(){
    return (
      <div>
        <br/>
        <Row key={`${this.props.imagesSource}_images`}>
          {this.renderGallery(this.props.imagesSource, this.props.imagesData)}
        </Row>
        <Row key={`${this.props.imagesSource}_images_pagination`}>
          <Col xs={12}>
            <CustomPagination page={this.state.activePage} count={(this.props.imagesData.images)? this.props.imagesData.images.length : 0} pageSelectFunc={this.handlePageSelect} maxPerPage={maxImagesPerPage}/>
          </Col>
        </Row>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {}
}

export default connect(mapStateToProps, actions)(LoweringGalleryTab);