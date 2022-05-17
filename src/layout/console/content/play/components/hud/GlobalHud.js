/**
 * Creates a global hud to manage any global display windows that sit on top of the environment.
 */
import Inventory from "./Inventory";
import Cursor from "./Cursor";
import GameState from "./GameState";
import Store from "./Store";

export default class GlobalHud {

  constructor(animationLoader, width, height) {
    this.animationLoader = animationLoader;
    this.width = width;
    this.height = height;

    this.isInventoryOpen = false;
    this.isMooviePickerOpen = false;
    this.isStoreOpen = false;


    this.gameState = new GameState();
  }
  preload(p5) {
    this.inventory = new Inventory(this.animationLoader, this.width, this.height, this, this.onActiveItemChanged);
    this.store = new Store(this.animationLoader, this.width, this.height, this);
    this.cursor = new Cursor(this.animationLoader, this.width, this.height);

    this.inventory.preload(p5);
    this.store.preload(p5);
    this.cursor.preload(p5);
  }

  draw(p5) {
    if (this.isInventoryOpen) {
      this.inventory.draw(p5);
    }
    if (this.isStoreOpen) {
      this.store.draw(p5);
    }

    this.cursor.draw(p5);
  }

  mousePressed(p5, fervie) {
    console.log("mousex = "+p5.mouseX + ", mousey = "+p5.mouseY);

    let footX = fervie.getFervieFootX(),
      footY = fervie.getFervieFootY();
    console.log("footX = "+footX + ", footY = "+footY);

    if (this.isInventoryOpen) {
      this.inventory.mousePressed(p5, fervie);
    }

    if (this.isStoreOpen) {
      this.store.mousePressed(p5, fervie);
    }
  }

  setIsActionableHover(isActionable, isItemActionable) {
    this.cursor.setIsActionableHover(isActionable);
    this.cursor.setIsItemActionable(isItemActionable);
  }

  getGameStateProperty(property) {
    return this.gameState.get(property);
  }

  setGameStateProperty(property, value) {
    this.gameState.set(property, value);
  }

  randomizeGameStateProperty(property) {
    this.gameState.randomizeProperty(property);
  }

  addInventoryItem(item) {
    this.inventory.addItem(item);
  }

  consumeActiveInventoryItem() {
    this.inventory.removeActiveItem();
  }

  getActiveItemSelection() {
    return this.inventory.getActiveItemSelection();
  }

  hasActiveItemSelection() {
    return (this.inventory.getActiveItemSelection() !== null);
  }

  openMooviePicker() {
    this.isMooviePickerOpen = true;
    let el = document.getElementById("playDialog");
    el.style.visibility = "visible";
  }

  openStore() {
    this.isStoreOpen = true;
  }

  closeStore() {
    this.isStoreOpen = false;
  }

  getStoreOpen() {
    return this.isStoreOpen;
  }

  getMooviePickerOpen() {
    return this.isMooviePickerOpen;
  }

  closeMooviePicker() {
    this.isMooviePickerOpen = false;
    let el = document.getElementById("playDialog");
    el.style.visibility = "hidden";
  }

  keyPressed(p5) {
    if (p5.keyCode === 73) {
      //i for inventory
      this.isInventoryOpen = !this.isInventoryOpen;
      this.store.setInventoryOpen(this.isInventoryOpen);
    }

    if (p5.keyCode === 27) {
      //escape pressed, clear selection
      this.inventory.setActiveItemSelection(null);
      if (this.isMooviePickerOpen) {
        this.closeMooviePicker();
      }
      if (this.isStoreOpen) {
        this.closeStore();
      }
    }
  }

  onActiveItemChanged = (item) =>{
    console.log("update active item = "+item);
    this.cursor.updateActiveItem(item);
  }
}
