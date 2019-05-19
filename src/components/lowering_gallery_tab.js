import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Row, Col, Card, Pagination, Image } from 'react-bootstrap';
import * as actions from '../actions';
import { ROOT_PATH } from '../client_config';

let fileDownload = require('js-file-download');

const maxEventsPerPage = 12

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

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  componentWillUnmount(){
  }

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
      if(index >= (this.state.activePage-1) * maxEventsPerPage && index < (this.state.activePage * maxEventsPerPage)) {
        return (
          <Col key={`${imagesSource}_${image.event_id}`} xs={12} sm={6} md={4} lg={3}>
            {this.renderImage(imagesSource, image.filepath, image.event_id)}
          </Col>
        )
      }
    })
  }

  renderPagination() {

    if( this.props.imagesData.images.length > maxEventsPerPage) {
      let eventCount = this.props.imagesData.images.length
      let last = Math.ceil(eventCount/maxEventsPerPage);
      let delta = 2
      let left = this.state.activePage - delta
      let right = this.state.activePage + delta + 1
      let range = []
      let rangeWithDots = []
      let l = null

      for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || i >= left && i < right) {
            range.push(i);
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(<Pagination.Item key={l + 1} active={(this.state.activePage === l+1)} onClick={() => this.handlePageSelect(l + 1)}>{l + 1}</Pagination.Item>);
          } else if (i - l !== 1) {
            rangeWithDots.push(<Pagination.Ellipsis key={`ellipsis_${i}`} />);
          }
        }
        rangeWithDots.push(<Pagination.Item key={i} active={(this.state.activePage === i)} onClick={() => this.handlePageSelect(i)}>{i}</Pagination.Item>);
        l = i;
      }

      return (
        <Pagination>
          <Pagination.First onClick={() => this.handlePageSelect(1)} />
          <Pagination.Prev onClick={() => { if(this.state.activePage > 1) { this.handlePageSelect(this.state.activePage-1)}}} />
          {rangeWithDots}
          <Pagination.Next onClick={() => { if(this.state.activePage < last) { this.handlePageSelect(prevState.activePage+1)}}} />
          <Pagination.Last onClick={() => this.handlePageSelect(last)} />
        </Pagination>
      );
    }
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
            {this.renderPagination()}
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