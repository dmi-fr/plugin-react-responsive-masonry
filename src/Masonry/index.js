import PropTypes from "prop-types"
import React from "react"

class Masonry extends React.Component {
  constructor() {
    super()
    this.containerRef = React.createRef()
    this.lastWidth = 0
    this.state = {columns: [], childRefs: []}
  }

  componentDidMount() {
    this.containerObserver = new ResizeObserver(([entry]) => {
      if (this.props.sequential) return

      const width = Math.round(entry.contentRect.width)

      if (Math.abs(width - this.lastWidth) < 200) {
        return
      }

      this.lastWidth = width

      this.distributeChildren()
    })

    this.childObserver = new ResizeObserver(() => {
      if (this.props.sequential) return

      const isReady = this.state.childRefs.every(
        (ref) => ref.current && ref.current.getBoundingClientRect().height > 0
      )

      if (isReady) {
        this.distributeChildren()
      }
    })

    if (this.containerRef.current) {
      this.lastWidth = this.containerRef.current.getBoundingClientRect().width

      this.containerObserver.observe(this.containerRef.current)
    }

    this.state.childRefs.forEach((ref) => {
      if (ref.current) {
        this.childObserver.observe(ref.current)
      }
    })
  }

  componentWillUnmount() {
    this.containerObserver && this.containerObserver.disconnect()
    this.childObserver && this.childObserver.disconnect()
  }

  static getDerivedStateFromProps(props, state) {
    const {children, columnsCount} = props
    const hasColumnsChanged = columnsCount !== state.columns.length
    if (state && children === state.children && !hasColumnsChanged) return null
    return {
      ...Masonry.getEqualCountColumns(children, columnsCount),
      children,
    }
  }

  distributeChildren() {
    const {children, columnsCount} = this.props
    const columnHeights = Array(columnsCount).fill(0)

    const columns = Array.from({length: columnsCount}, () => [])
    let validIndex = 0

    if (
      !this.state.childRefs[validIndex] ||
      !this.state.childRefs[validIndex].current
    ) {
      return
    }

    React.Children.forEach(children, (child) => {
      if (child && React.isValidElement(child)) {
        // .current is undefined if ref was passed to a functional component without forwardRef
        // now passing ref into a wrapper div so it should always be defined
        const childHeight =
          this.state.childRefs[validIndex].current.getBoundingClientRect()
            .height
        const minHeightColumnIndex = columnHeights.indexOf(
          Math.min(...columnHeights)
        )
        columnHeights[minHeightColumnIndex] += childHeight
        columns[minHeightColumnIndex].push(child)
        validIndex++
      }
    })

    this.setState((p) => ({...p, columns}))
  }

  static getEqualCountColumns(children, columnsCount) {
    const columns = Array.from({length: columnsCount}, () => [])
    let validIndex = 0
    const childRefs = []
    React.Children.forEach(children, (child) => {
      if (child && React.isValidElement(child)) {
        const ref = React.createRef()
        childRefs.push(ref)
        columns[validIndex % columnsCount].push(
          <div
            style={{display: "flex", justifyContent: "stretch"}}
            key={validIndex}
            ref={ref}
          >
            {child}
          </div>
          // React.cloneElement(child, {ref}) // cannot attach refs to functional components without forwardRef
        )
        validIndex++
      }
    })
    return {columns, childRefs}
  }

  renderColumns() {
    const {gutter, itemTag, itemStyle} = this.props
    return this.state.columns.map((column, i) =>
      React.createElement(
        itemTag,
        {
          key: i,
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignContent: "stretch",
            flex: 1,
            width: 0,
            gap: gutter,
            ...itemStyle,
          },
        },
        column.map((item) => item)
      )
    )
  }

  render() {
    const {gutter, className, style, containerTag} = this.props

    return React.createElement(
      containerTag,
      {
        ref: this.containerRef,
        style: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignContent: "stretch",
          boxSizing: "border-box",
          width: "100%",
          gap: gutter,
          ...style,
        },
        className,
      },
      this.renderColumns()
    )
  }
}

Masonry.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  columnsCount: PropTypes.number,
  gutter: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  containerTag: PropTypes.string,
  itemTag: PropTypes.string,
  itemStyle: PropTypes.object,
  sequential: PropTypes.bool,
}

Masonry.defaultProps = {
  columnsCount: 3,
  gutter: "0",
  className: null,
  style: {},
  containerTag: "div",
  itemTag: "div",
  itemStyle: {},
  sequential: false,
}

export default Masonry
