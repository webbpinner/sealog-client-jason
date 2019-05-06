import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { reduxForm, Field, reset } from 'redux-form';
import { Row, Button, Col, Card, Alert, Table, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import CreateLowering from './create_lowering';
import UpdateLowering from './update_lowering';
import DeleteLoweringModal from './delete_lowering_modal';
import ImportLoweringsModal from './import_lowerings_modal';
import * as actions from '../actions';

let fileDownload = require('js-file-download');

const maxLoweringsPerPage = 8

class Lowerings extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
      loweringAccess: false,
      loweringUpdate: false
    }

    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.handleLoweringImportClose = this.handleLoweringImportClose.bind(this);

  }

  componentWillMount() {
    this.props.fetchLowerings();
  }

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleLoweringDeleteModal(id) {
    this.props.showModal('deleteLowering', { id: id, handleDelete: this.props.deleteLowering });
  }

  handleLoweringUpdate(id) {
    this.props.initLowering(id);
    this.setState({loweringUpdate: true, loweringAccess: false});
    window.scrollTo(0, 0);
  }

  handleLoweringAccess(id) {
    this.props.initLowering(id);
    this.setState({loweringUpdate: false, loweringAccess: true});
    window.scrollTo(0, 0);
  }

  handleLoweringShow(id) {
    this.props.showLowering(id);
  }

  handleLoweringHide(id) {
    this.props.hideLowering(id);
  }

  handleLoweringCreate() {
    this.props.leaveUpdateLoweringForm()
    this.setState({loweringUpdate: false, loweringAccess: false});
  }

  handleLoweringImportModal() {
    this.props.showModal('importLowerings', { handleHide: this.handleLoweringImportClose });
  }

  handleLoweringImportClose() {
    this.props.fetchLowerings();
  }

  exportLoweringsToJSON() {
    fileDownload(JSON.stringify(this.props.lowerings, null, 2), 'sealog_loweringExport.json');
  }

  renderAddLoweringButton() {
    if (!this.props.showform && this.props.roles && this.props.roles.includes('admin')) {
      return (
        <div className="float-right">
          <Button variant="primary" size="sm" onClick={ () => this.handleLoweringCreate()} disabled={!this.state.loweringUpdate}>Add Lowering</Button>
        </div>
      );
    }
  }

  renderImportLoweringsButton() {
    if(this.props.roles.includes("admin")) {
      return (
        <div className="float-right">
          <Button variant="primary" size="sm" onClick={ () => this.handleLoweringImportModal()}>Import From File</Button>
        </div>
      );
    }
  }

  renderLowerings() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this lowering.</Tooltip>)
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this lowering.</Tooltip>)
    const showTooltip = (<Tooltip id="showTooltip">Cruise is hidden, click to show.</Tooltip>)
    const hideTooltip = (<Tooltip id="hideTooltip">Cruise is visible, click to hide.</Tooltip>)

    return this.props.lowerings.map((lowering, index) => {
      if(index >= (this.state.activePage-1) * maxLoweringsPerPage && index < (this.state.activePage * maxLoweringsPerPage)) {
        let deleteLink = (this.props.roles.includes('admin'))? <OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon className="text-danger" onClick={ () => this.handleLoweringDeleteModal(lowering.id) } icon='trash' fixedWidth/></OverlayTrigger>: null
        let hiddenLink = null;

        if(this.props.roles.includes('admin') && lowering.lowering_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={showTooltip}><FontAwesomeIcon onClick={ () => this.handleLoweringShow(lowering.id) } icon='eye-slash' fixedWidth/></OverlayTrigger>
        } else if(this.props.roles.includes('admin') && !lowering.lowering_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesomeIcon className="text-success" onClick={ () => this.handleLoweringHide(lowering.id) } icon='eye' fixedWidth/></OverlayTrigger>  
        }

        let loweringLocation = (lowering.lowering_location)? <span>Location: {lowering.lowering_location}<br/></span> : null
        let loweringStartTime = moment(lowering.start_ts)
        let loweringEndTime = moment(lowering.stop_ts)
        let loweringStarted = <span>Started: {loweringStartTime.format("YYYY-MM-DD hh:mm")}<br/></span>
        let loweringDuration = loweringEndTime.diff(loweringStartTime)

        let loweringDurationStr = <span>Duration: {moment.duration(loweringDuration).format("d [days] h [hours] m [minutes]")}<br/></span>

        return (
          <tr key={lowering.id}>
            <td className={(this.props.loweringid == lowering.id)? "text-warning" : ""}>{lowering.lowering_id}</td>
            <td>{loweringLocation}{loweringStarted}{loweringDurationStr}</td>
            <td>
              <OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleLoweringUpdate(lowering.id) } icon='pencil-alt' fixedWidth/></OverlayTrigger>
              {deleteLink}
              {hiddenLink}
            </td>
          </tr>
        );
      }
    })      
  }

  renderLoweringTable() {
    if(this.props.lowerings && this.props.lowerings.length > 0){
      return (
        <Table responsive bordered striped>
          <thead>
            <tr>
              <th>Lowering</th>
              <th>Details</th>
              <th style={{width: "80px"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderLowerings()}
          </tbody>
        </Table>
      )
    } else {
      return (
        <Card.Body>No Lowerings Found!</Card.Body>
      )
    }
  }

  renderLoweringHeader() {

    const Label = "Lowerings"
    const exportTooltip = (<Tooltip id="exportTooltip">Export Lowerings</Tooltip>)

    return (
      <div>
        { Label }
        <div className="float-right">
          <OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon onClick={ () => this.exportLoweringsToJSON() } icon='download' fixedWidth/></OverlayTrigger>
        </div>
      </div>
    );
  }

  renderPagination() {
    if(this.props.lowerings && this.props.lowerings.length > maxLoweringsPerPage) {

      let priceCount = this.props.lowerings.length;
      let last = Math.ceil(priceCount/maxLoweringsPerPage);
      let delta = 2
      let left = this.state.activePage - delta
      let right = this.state.activePage + delta + 1
      let range = []
      let rangeWithDots = []
      let l = null

      for (let i = 1; i <= last; i++) {
        if (i == 1 || i == last || i >= left && i < right) {
            range.push(i);
        }
      }

      for (let i of range) {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(<Pagination.Item key={l + 1} active={(this.state.activePage === l+1)} onClick={() => this.setState({activePage: (l + 1)})}>{l + 1}</Pagination.Item>)
          } else if (i - l !== 1) {
            rangeWithDots.push(<Pagination.Ellipsis  key={`ellipsis_${i}`} />);
          }
        }
        rangeWithDots.push(<Pagination.Item key={i} active={(this.state.activePage === i)} onClick={() => this.setState({activePage: i})}>{i}</Pagination.Item>);
        l = i;
      }

      return (
        <Pagination>
          <Pagination.First onClick={() => this.setState({activePage: 1})} />
          <Pagination.Prev onClick={() => { if(this.state.activePage > 1) { this.setState(prevState => ({ activePage: prevState.activePage-1}))}}} />
          {rangeWithDots}
          <Pagination.Next onClick={() => { if(this.state.activePage < last) { this.setState(prevState => ({ activePage: prevState.activePage+1}))}}} />
          <Pagination.Last onClick={() => this.setState({activePage: last})} />
        </Pagination>
      )
    }
  }

  render() {
    if (!this.props.roles) {
        return (
          <div>Loading...</div>
        )
    }

    if(this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager')) {

      let loweringForm = null;
  
      if(this.state.loweringUpdate) {
        loweringForm = <UpdateLowering handleFormSubmit={ this.props.fetchLowerings } />
      } else if(this.state.loweringAccess) {
        loweringForm = <AccessLowering handleFormSubmit={ this.props.fetchLowerings } />
      } else {
        loweringForm = <CreateLowering handleFormSubmit={ this.props.fetchLowerings } />
      }

      return (
        <div>
          <DeleteLoweringModal />
          <ImportLoweringsModal  handleExit={this.handleLoweringImportClose} />
          <Row>
            <Col sm={12} md={7} lg={6} xl={{span:5, offset:1}}>
              <Card border="secondary">
                <Card.Header>{this.renderLoweringHeader()}</Card.Header>
                {this.renderLoweringTable()}
                {this.renderPagination()}
              </Card>
              <div style={{marginTop: "8px", marginRight: "-8px"}}>
                {this.renderAddLoweringButton()}
                {this.renderImportLoweringsButton()}
              </div>
            </Col>
            <Col sm={12} md={5} lg={6} xl={5}>
              { loweringForm }
            </Col>
          </Row>
        </div>
      );
    } else {
      return (
        <div>
          What are YOU doing here?
        </div>
      )
    }
  }
}

function mapStateToProps(state) {
  return {
    lowerings: state.lowering.lowerings,
    loweringid: state.lowering.lowering.id,
    roles: state.user.profile.roles
  }
}

export default connect(mapStateToProps, actions)(Lowerings);