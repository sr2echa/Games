class GenNumber extends React.Component {
  componentDidUpdate() {
    let time, digit;
    // increase showing time depend on level
    digit = this.props.level.main + 2;
    time = 100 * Math.min(digit, 5) + 400 * Math.max(digit - 5, 0);

    let number = document.getElementById('number');
    setTimeout(function () {
      number.innerHTML = number.innerHTML.replace(/\w/gi, '&#183;');
    }, time);

  }
  componentDidMount() {
    let number = document.getElementById('number');
    setTimeout(function () {
      number.innerHTML = number.innerHTML.replace(/\w|\W/gi, '&#183;');
    }, 1200);
  }
  render() {
    return /*#__PURE__*/(
      React.createElement("div", { className: "app__gen-number" }, /*#__PURE__*/
      React.createElement("div", { className: "app__info" }, /*#__PURE__*/
      React.createElement("p", { className: "app__level" }, "Level: ", this.props.level.main, " - ", this.props.level.sub), /*#__PURE__*/
      React.createElement("p", { className: "app__wrong" }, "Wrong: ", this.props.wrong, "/3")), /*#__PURE__*/

      React.createElement("p", { className: "app__divider" }, "############################"), /*#__PURE__*/
      React.createElement("p", { className: "app__number", id: "number" }, this.props.wrong < 3 ? atob(this.props.question) : '????'), /*#__PURE__*/
      React.createElement("p", { className: "app__divider" }, "############################")));


  }}


class InputNumber extends React.Component {
  constructor() {
    super();
    this.handleUserInput = this.handleUserInput.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }
  handleUserInput(e) {
    e.preventDefault();
    let userNumber = btoa(this.userNumber.value);
    this.userNumber.value = "";
    this.props.compareUserInput(userNumber);
  }
  handleReset() {
    this.props.onReset();
  }
  render() {
    let layout;
    if (this.props.wrong < 3) {
      layout = /*#__PURE__*/React.createElement("div", { className: "app__input" }, /*#__PURE__*/
      React.createElement("form", { onSubmit: this.handleUserInput }, "Number is:", /*#__PURE__*/

      React.createElement("input", {
        pattern: "[0-9]+",
        type: "text",
        ref: ref => this.userNumber = ref,
        required: true,
        autoFocus: true }), /*#__PURE__*/
      React.createElement("br", null), /*#__PURE__*/
      React.createElement("br", null)), /*#__PURE__*/

      React.createElement("button", { onClick: this.handleReset }, "Restart"));

    } else {
      layout = /*#__PURE__*/React.createElement("div", { className: "app__end" }, /*#__PURE__*/
      React.createElement("div", { class: "app__notify" }, "Better luck next time (\u2727\u03C9\u2727)"), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("button", { onClick: this.handleReset }, "Restart"));

    }

    return layout;
  }}


class App extends React.Component {
  constructor() {
    super();
    this.compareUserInput = this.compareUserInput.bind(this);
    this.randomGenerate = this.randomGenerate.bind(this);
    this.resetState = this.resetState.bind(this);
    this.state = {
      question: btoa(this.randomGenerate(2)),
      level: { main: 1, sub: 1 },
      wrong: 0 };

  }
  resetState() {
    this.setState({
      question: btoa(this.randomGenerate(2)),
      level: { main: 1, sub: 1 },
      wrong: 0 });

  }
  randomGenerate(digit) {
    let max = Math.pow(10, digit) - 1,
    min = Math.pow(10, digit - 1);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  compareUserInput(userNumber) {
    let currQuestion = this.state.question,
    mainLevel = this.state.level.main,
    subLevel = this.state.level.sub,
    wrong = this.state.wrong,
    digit;

    if (userNumber == currQuestion) {
      if (subLevel < 3) {
        ++subLevel;
      } else
      if (subLevel == 3) {
        ++mainLevel;
        subLevel = 1;
      }
    } else {
      ++wrong;
    }
    digit = mainLevel + 2;

    this.setState({
      question: btoa(this.randomGenerate(digit)),
      level: { main: mainLevel, sub: subLevel },
      wrong: wrong });

  }
  render() {
    return /*#__PURE__*/(
      React.createElement("div", { className: "main__app" }, /*#__PURE__*/
      React.createElement(GenNumber, {
        question: this.state.question,
        level: this.state.level,
        wrong: this.state.wrong }), /*#__PURE__*/
      React.createElement(InputNumber, {
        compareUserInput: this.compareUserInput,
        wrong: this.state.wrong,
        onReset: this.resetState })));


  }}


ReactDOM.render( /*#__PURE__*/
React.createElement(App, null),
document.getElementById('app'));