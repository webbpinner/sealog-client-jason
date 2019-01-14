import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { reduxForm, Field, reset } from 'redux-form';
import { FormGroup, Row, Button, Col, Panel, Alert, Table, OverlayTrigger, Tooltip, Pagination } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import moment from 'moment';
import CreateLowering from './create_lowering';
import UpdateLowering from './update_lowering';
import DeleteLoweringModal from './delete_lowering_modal';
import ImportLoweringsModal from './import_lowerings_modal';
import * as actions from '../actions';

let fileDownload = require('js-file-download');

const maxLoweringsPerPage = 14

class Lowerings extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
    }

    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.handleLoweringImportClose = this.handleLoweringImportClose.bind(this);

  }

  componentWillMount() {
      this.props.fetchLowerings();
  }

  // componentDidUpdate() {
  //   if(this.props.lowerings.length > 0 && !this.state.lowering){
  //     this.handleLoweringSelect(this.props.lowerings[0].id)
  //   }
  // }

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleLoweringDeleteModal(id) {
    this.props.showModal('deleteLowering', { id: id, handleDelete: this.props.deleteLowering });
  }

  handleLoweringSelect(id) {
    this.props.initLowering(id);
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
  }

  handleLoweringImportModal() {
    this.props.showModal('importLowerings', { handleHide: this.handleLoweringImportClose });
  }

  handleLoweringImportClose() {
    this.props.fetchLowerings();
  }

  exportLoweringsToJSON() {
    fileDownload(JSON.stringify(this.props.lowerings, null, 2), 'seaplay_loweringExport.json');
  }

  renderAddLoweringButton() {
    if (!this.props.showform && this.props.roles && this.props.roles.includes('admin')) {
      return (
        <div className="pull-right">
          <Button bsStyle="primary" bsSize="small" type="button" onClick={ () => this.handleLoweringCreate()}>Add Lowering</Button>
        </div>
      );
    }
  }

  renderImportLoweringsButton() {
    if(this.props.roles.includes("admin")) {
      return (
        <div className="pull-right">
          <Button bsStyle="primary" bsSize="small" type="button" onClick={ () => this.handleLoweringImportModal()}>Import From File</Button>
        </div>
      );
    }
  }

  renderLowerings() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this lowering.</Tooltip>)
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this lowering.</Tooltip>)
    const showTooltip = (<Tooltip id="deleteTooltip">Allow users to view this lowering.</Tooltip>)
    const hideTooltip = (<Tooltip id="deleteTooltip">Hide this lowering from users.</Tooltip>)

    return this.props.lowerings.map((lowering, index) => {
      if(index >= (this.state.activePage-1) * maxLoweringsPerPage && index < (this.state.activePage * maxLoweringsPerPage)) {
        let deleteLink = (this.props.roles.includes('admin'))? <Link key={`delete_${lowering.id}`} to="#" onClick={ () => this.handleLoweringDeleteModal(lowering.id) }><OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon icon='trash' fixedWidth/></OverlayTrigger></Link>: null
        let hiddenLink = null;
        if(this.props.roles.includes('admin') && lowering.lowering_hidden) {
          hiddenLink = <Link key={`show_${lowering.id}`} to="#" onClick={ () => this.handleLoweringShow(lowering.id) }><OverlayTrigger placement="top" overlay={showTooltip}><FontAwesomeIcon icon='eye-slash' fixedWidth/></OverlayTrigger></Link>
        } else if(this.props.roles.includes('admin') && !lowering.lowering_hidden) {
          hiddenLink = <Link key={`show_${lowering.id}`} to="#" onClick={ () => this.handleLoweringHide(lowering.id) }><OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesomeIcon icon='eye' fixedWidth/></OverlayTrigger></Link>  
        }

        return (
          <tr key={lowering.id}>
            <td>{lowering.lowering_id}</td>
            <td>{lowering.lowering_location}<br/>Pilot: {lowering.lowering_pilot}<br/>Observers: {lowering.lowering_observers.join(', ')}<br/>Dates: {moment.utc(lowering.start_ts).format("MM-DD-YYYY HH:mm")}<FontAwesomeIcon icon='arrow-right' fixedWidth/>{moment.utc(lowering.stop_ts).format("MM-DD-YYYY HH:mm")}</td>
            <td>
              <Link key={`edit_${lowering.id}`} to="#" onClick={ () => this.handleLoweringSelect(lowering.id) }><OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon icon='pencil-alt' fixedWidth/></OverlayTrigger></Link>
              {' '}
              {deleteLink}
              {' '}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderLowerings()}
          </tbody>
        </Table>
      )
    } else {
      return (
        <Panel.Body>No Lowerings Found!</Panel.Body>
      )
    }
  }

  renderLoweringHeader() {

    const Label = "Lowerings"
    const exportTooltip = (<Tooltip id="exportTooltip">Export Lowerings</Tooltip>)

    return (
      <div>
        { Label }
        <div className="pull-right">
          <Button bsStyle="default" bsSize="xs" type="button" onClick={ () => this.exportLoweringsToJSON() }><OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon icon='download' fixedWidth/></OverlayTrigger></Button>
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
            rangeWithDots.push(<Pagination.Ellipsis />);
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

      let loweringForm = (this.props.loweringid)? <UpdateLowering handleFormSubmit={ this.props.fetchLowerings } /> : <CreateLowering handleFormSubmit={ this.props.fetchLowerings } />

      return (
        <div>
          <DeleteLoweringModal />
          <ImportLoweringsModal  handleExit={this.handleLoweringImportClose} />
          <Row>
            <Col sm={10} md={7} lgOffset= {1} lg={6}>
              <Panel>
                <Panel.Heading>{this.renderLoweringHeader()}</Panel.Heading>
                {this.renderLoweringTable()}
                {this.renderPagination()}
              </Panel>
              {this.renderAddLoweringButton()}
              {this.renderImportLoweringsButton()}
            </Col>
            <Col sm={6} md={5} lg={4}>
              { loweringForm }
            </Col>
          </Row>
        </div>
      );
      // return (
      //   <div>
      //     <DeleteLoweringModal />
      //     <Row>
      //       <Col sm={6} md={5} lg={4}>
      //         { loweringForm }
      //       </Col>
      //     </Row>
      //   </div>
      // );

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