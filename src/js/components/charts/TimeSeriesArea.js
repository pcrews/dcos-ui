import d3 from "d3";
import PropTypes from "prop-types";
import React from "react";
import ReactDOM from "react-dom";

class TimeSeriesArea extends React.Component {
  componentDidMount() {
    var props = this.props;

    d3.select(ReactDOM.findDOMNode(this))
      .transition()
      .duration(props.transitionTime)
      .ease("linear")
      .attr("transform", "translate(" + props.position + ")");
  }

  componentWillReceiveProps(props) {
    d3.select(ReactDOM.findDOMNode(this))
      .interrupt()
      .attr("transform", null)
      .transition()
      .duration(props.transitionTime)
      .ease("linear")
      .attr("transform", "translate(" + props.position + ")");
  }

  render() {
    const { className } = this.props;

    return (
      <g>
        <path className={"area " + className} d={this.props.path} />
        <path className={"line " + className} d={this.props.line} />
      </g>
    );
  }
}

TimeSeriesArea.displayName = "TimeSeriesArea";

TimeSeriesArea.propTypes = {
  className: PropTypes.string,
  line: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  position: PropTypes.array.isRequired,
  transitionTime: PropTypes.number.isRequired
};

module.exports = TimeSeriesArea;
