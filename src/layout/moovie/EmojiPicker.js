import React, {Component} from "react";
import * as unicodeEmoji from 'unicode-emoji';
import {Button, Input, Label, Menu, Popup} from "semantic-ui-react";

/**
 * this component handles the popup emoji picker
 */
export default class EmojiPicker extends Component {

  static defaultSkinTone = "🖖";

  /**
   * Initialize the layout
   * @param props - the properties of the component to render
   */
  constructor(props) {
    super(props);
    this.name = "[EmojiPicker]";

    let skinToneSelection = EmojiPicker.defaultSkinTone;
    if (this.props.skinToneSelection) {
      skinToneSelection = this.props.skinToneSelection;
    }

    this.state = {
      chatValue: "",
      currentSearchValue: "",
      activeGroup : "😀",
      filteredEmojis: null,
      isSkinTonePickerOpen: false,
      skinToneSelection: skinToneSelection
    };
    this.isEnterKeyPressed = false;

    this.groupedEmojis = unicodeEmoji.getEmojisGroupedBy(EmojiPicker.categoryGroup, EmojiPicker.omitWhere);
    this.allEmojis = unicodeEmoji.getEmojis(EmojiPicker.omitWhere);

    console.log(this.groupedEmojis);

    this.skinToneMap = new Map();
    this.skinToneMap.set("🖖🏻", " light skin tone");
    this.skinToneMap.set("🖖🏼", " medium-light skin tone");
    this.skinToneMap.set("🖖🏽", " medium skin tone");
    this.skinToneMap.set("🖖🏾", " medium-dark skin tone");
    this.skinToneMap.set("🖖🏿", " dark skin tone");

  }

  static categoryGroup = 'category';

  static omitWhere = { versionAbove: '12.0' };

  static groups = [
    {
      name: "Smileys and People",
      groupIds: ["face-emotion", "person-people"],
      emoji: "😀"
    },
    {
      name: "Animals and Nature",
      groupIds: ["animals-nature"],
      emoji: "🐮"
    },
    {
      name: "Food and Drink",
      groupIds: ["food-drink"],
      emoji: "🍕"
    },
    {
      name: "Activity",
      groupIds: ["activities-events"],
      emoji: "⚽"
    },
    {
      name: "Travel and Places",
      groupIds: ["travel-places"],
      emoji: "🏝️"
    },
    {
      name: "Objects",
      groupIds: ["objects"],
      emoji: "🧢"
    },
    {
      name: "Symbols",
      groupIds: ["symbols"],
      emoji: "✅"
    },
    {
      name: "Flags",
      groupIds: ["flags"],
      emoji: "🚩"
    },
  ];

  /**
   * Called when the chat console is first loaded
   */
  componentDidMount = () => {
  };

  /**
   * called right before when the component will unmount
   */
  componentWillUnmount = () => {
  };

  handleChangeForSearch = (e, { value }) => {
    this.setState({
      currentSearchValue: value,
    });

    if (value.length > 0) {
      this.updateFilteredEmojis(value);
    } else {
      this.setState({
        filteredEmojis: null
      });
    }


  };

  /**
   * When we change the search value, look through the available emojis,
   * and put together a filtered list based on the search results
   * @param searchValue
   */
  updateFilteredEmojis(searchValue) {
    let matchingEmojis = [];
    for (let emoji of this.allEmojis) {
      if (emoji.description.startsWith(searchValue)) {
        matchingEmojis.push(emoji);
      } else {
        for (let keyword of emoji.keywords) {
          if (keyword.includes(searchValue)) {
            matchingEmojis.push(emoji);
            break;
          }
        }
      }
    }

    this.setState({
      filteredEmojis: matchingEmojis
    });
  }

  //{emoji: '🎃', description: 'jack-o-lantern', version: '0.6', keywords: Array(5), category: 'activities-events', …}



  handleMenuClick = (emoji) => {
    this.setState({
      activeGroup: emoji
    });
    this.props.onRefreshEmojiWindow();
  }

  handleEmojiClick = (emoji) => {
    this.props.onRefreshEmojiWindow();
    this.props.pasteEmojiInChat(emoji);
  }

  handleSearchClick = () => {
    console.log("search click");
    this.props.onClickEmojiSearch();
  }

  handleSearchBlur = () => {
    console.log("search click");
    this.props.onBlurEmojiSearch();
  }

  handleSkinToneChooserClick = () => {
    console.log("skin click");
    this.props.onRefreshEmojiWindow();
    this.setState((prevState) => {
      return {
        isSkinTonePickerOpen: !prevState.isSkinTonePickerOpen
      }
    });
  }

  handleSkinToneSelectionClick = (skinTone) => {
    console.log("skin selectionClick");
    this.props.onRefreshEmojiWindow();
    this.setState({
      skinToneSelection: skinTone,
      isSkinTonePickerOpen: false
    });
    this.props.setSkinToneSelection(skinTone);
  }

  getMenuItems() {
    return (
      <Menu pointing secondary inverted>
        {
          EmojiPicker.groups.map((group, i) => {
            return (
              <Menu.Item
                key={i}
                name={group.emoji}
                active={this.state.activeGroup === group.emoji}
                onClick={() => {
                  this.handleMenuClick(group.emoji);
                }}
              />
            );
          })
        }
      </Menu>
      );
  }

  getEmojisForGroup(group, index) {
    let groupId = group.groupIds[index];

    return this.groupedEmojis[groupId].map((emojiDescription, i) => {
      return (<span key={i} className="emoji" onClick={() => this.handleEmojiClick(emojiDescription.emoji)}>{this.getEmojiVersion(emojiDescription)}</span>);
    });
  }

  getEmojisForFilteredList(emojiList) {
    return emojiList.map((emojiDescription, i) => {
      return (<span key={i} className="emoji" onClick={() => this.handleEmojiClick(emojiDescription.emoji)}>{this.getEmojiVersion(emojiDescription)}</span>);
    });
  }

  getEmojiVersion(emojiDescription) {
    if (!emojiDescription.variations || this.state.skinToneSelection === EmojiPicker.defaultSkinTone) {
      return emojiDescription.emoji;
    }

    let skinSearchString = this.skinToneMap.get(this.state.skinToneSelection);
    for (let variation of emojiDescription.variations) {
      if (variation.description.includes(skinSearchString)) {
        return variation.emoji;
      }
    }
    return emojiDescription.emoji;

  }

  getEmojisForSelection() {
    const group = this.getActiveGroup();

    return this.getEmojisForGroup(group, 0);
  }

  getActiveGroup() {
    for (let group of EmojiPicker.groups) {
      if (group.emoji === this.state.activeGroup) {
        return group;
      }
    }
    return EmojiPicker.groups[0];
  }


  getSkinToneChooser() {
    return (<Popup
      position='top right'
      basic
      inverted
      offset={[10, 0]}
      open={this.state.isSkinTonePickerOpen}
      trigger={
        (<Label onClick={this.handleSkinToneChooserClick} className="skinToneChooserButton">{this.state.skinToneSelection}</Label>)
      }
    >
      <Popup.Content>
        <Label onClick={() => {this.handleSkinToneSelectionClick("🖖🏿")}} className="emojiAction">🖖🏿</Label>
        <Label onClick={() => {this.handleSkinToneSelectionClick("🖖🏾")}} className="emojiAction">🖖🏾</Label>
        <Label onClick={() => {this.handleSkinToneSelectionClick("🖖🏽")}} className="emojiAction">🖖🏽</Label>
        <Label onClick={() => {this.handleSkinToneSelectionClick("🖖🏼")}} className="emojiAction">🖖🏼</Label>
        <Label onClick={() => {this.handleSkinToneSelectionClick("🖖🏻")}} className="emojiAction">🖖🏻</Label>
        <Label onClick={() => {this.handleSkinToneSelectionClick("🖖")}} className="emojiAction">🖖</Label>
      </Popup.Content>
    </Popup>);
  }

  /**
   * renders the layout of the view
   * @returns {*} - the JSX to render
   */
  render() {

    let emojiList = "";
    let emojiListExtra = "";

    if (this.state.filteredEmojis !== null) {
      emojiList = this.getEmojisForFilteredList(this.state.filteredEmojis);
    } else {
      emojiList = this.getEmojisForSelection();

      if (EmojiPicker.groups[0].emoji === this.state.activeGroup) {
        emojiListExtra = this.getEmojisForGroup(EmojiPicker.groups[0], 1);
      }
    }

    return (
      <div id="emojiPicker" >
        <div className="emojiSearch">
          <Input
            id="emojiSearchInput"
            className="emojiSearchInput"
            icon='search'
            inverted
            placeholder={"Search emojis"}
            value={this.state.currentSearchValue}
            onChange={this.handleChangeForSearch}
            onClick={this.handleSearchClick}
            onBlur={this.handleSearchBlur}
          />
          {this.getSkinToneChooser()}
        </div>
        <div className="filterGroups">
          {this.getMenuItems()}
        </div>
        <div className="scrolling">
          {emojiList}
          {emojiListExtra}
        </div>
      </div>
    );
  }


}
