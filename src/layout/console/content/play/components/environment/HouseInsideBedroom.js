/**
 * Creates our inside house map, the bedroom inside the house
 */
import Environment from "./Environment";
import MoovieFervieSprite from "../characters/MoovieFervieSprite";
import LadyFervieSprite from "../characters/LadyFervieSprite";
import GameState from "../hud/GameState";

export default class HouseInsideBedroom extends Environment {
  static BACKGROUND_IMAGE =
    "./assets/animation/insidehouse/house_inside_bedroom_background.png";
  static WALK_BEHIND_ITEMS =
    "./assets/animation/insidehouse/house_inside_bedroom_walkbehind.png";

  static WALK_AREA_IMAGE =
    "./assets/animation/insidehouse/house_inside_bedroom_walkarea.png";
  static WALK_BEHIND_AREA_IMAGE =
    "./assets/animation/insidehouse/house_inside_bedroom_walkarea_behind.png";
  static FIREPLACE_GIF =
    "./assets/animation/insidehouse/fire.gif";

  static CHAIR_OVERLAY =
    "./assets/animation/insidehouse/house_inside_bedroom_chairarm.png";


  constructor(animationLoader, width, height, globalHud) {
    super(animationLoader, width, height, globalHud);

    this.ladyFervieSprite = new LadyFervieSprite(this.animationLoader, 600, 300, 200, 0.45);
  }

  /**
   * Preload all the environment images, so they are cached and ready to display
   * @param p5
   */
  preload(p5) {
    super.preload(p5);
    this.animationLoader.getStaticImage(p5, HouseInsideBedroom.BACKGROUND_IMAGE);
    this.animationLoader.getStaticImage(p5, HouseInsideBedroom.WALK_BEHIND_ITEMS);

    this.animationLoader.getStaticImage(p5, HouseInsideBedroom.WALK_AREA_IMAGE);
    this.animationLoader.getStaticImage(p5, HouseInsideBedroom.WALK_BEHIND_AREA_IMAGE);

    this.animationLoader.getStaticImage(p5, HouseInsideBedroom.FIREPLACE_GIF);
    this.animationLoader.getStaticImage(p5, HouseInsideBedroom.CHAIR_OVERLAY);

    let isLadyVisible = this.globalHud.getGameStateProperty(GameState.Property.HAS_ENTERED_BEDROOM);

    if (isLadyVisible) {
      this.ladyFervieSprite.setVisible(true);

      let hasSettledIn = this.globalHud.getGameStateProperty(GameState.Property.HAS_SETTLED_IN_HOUSE);
      if (!hasSettledIn) {
        this.ladyFervieSprite.setPosition(600, 320);
        this.playIntroAnimation();
      } else {
        this.ladyFervieSprite.setPosition(800, 300);
      }
    } else {
      this.ladyFervieSprite.setVisible(false);
    }
    this.ladyFervieSprite.preload(p5);

    this.moovieFervieSprite = new MoovieFervieSprite(this.animationLoader,
      500,
      Math.round(HouseInsideBedroom.IMAGE_HEIGHT / 2 + 43),
      150
    );

    this.moovieFervieSprite.preload(p5);
  }

  playIntroAnimation() {
    this.ladyFervieSprite.walkLeft(150, () => {
      console.log("done!");
      this.ladyFervieSprite.neutral();
      setTimeout(() => {
        this.ladyFervieSprite.dance();
        setTimeout(() => {
          this.ladyFervieSprite.neutral();
          setTimeout(() => {
            this.ladyFervieSprite.walkRight(350, () => {
              this.ladyFervieSprite.walkUp(20, () => {
                this.ladyFervieSprite.neutral();
                this.globalHud.setGameStateProperty(GameState.Property.HAS_SETTLED_IN_HOUSE, true);
              });
            });
          }, 2000);
        }, 2000);
      }, 1000);
    });
  }

  getDefaultSpawnProperties() {
    return this.getSouthSpawnProperties();
  }

  getSouthSpawnProperties() {
    return {
      x: Math.round(this.width / 2),
      y: Math.round(
        (HouseInsideBedroom.IMAGE_HEIGHT - 180) *
          this.scaleAmountY
      ),
      scale: 0.9
    };
  }

  isColliding(direction, fervieFootX, fervieFootY) {
    return (this.ladyFervieSprite.isCollidingWithLady(direction, fervieFootX, fervieFootY, this.scaleAmountX, this.scaleAmountY));
  }

  isValidPosition(p5, x, y) {
    let walkAreaImage = this.animationLoader.getStaticImage(p5, HouseInsideBedroom.WALK_AREA_IMAGE);
    return super.isWithinTargetArea(walkAreaImage, x, y);
  }

  isWalkBehindPosition(p5, x, y) {
    let walkAreaImage = this.animationLoader.getStaticImage(p5, HouseInsideBedroom.WALK_BEHIND_AREA_IMAGE);
    return super.isWithinTargetArea(walkAreaImage, x, y);
  }

  /**
   * Draw the background environment on the screen
   * @param p5
   */
  drawBackground(p5, fervie) {
    let backgroundImage = this.animationLoader.getStaticImage(p5, HouseInsideBedroom.BACKGROUND_IMAGE);

    p5.push();
    p5.scale(this.scaleAmountX, this.scaleAmountY);

    p5.image(backgroundImage, 0, 0);
    this.drawFire(p5);

    if (!this.ladyFervieSprite.isFervieBehindLady(fervie, this.scaleAmountX, this.scaleAmountY)) {
      this.ladyFervieSprite.draw(p5);
    }

    if (this.isOverLady(p5.mouseX, p5.mouseY)) {
      this.globalHud.setIsActionableHover(true, false);
    } else {
      this.globalHud.setIsActionableHover(false, false);
    }

    p5.pop();
  }

  drawOverlay(p5, fervie) {
    let walkBehindItems = this.animationLoader.getStaticImage(p5, HouseInsideBedroom.WALK_BEHIND_ITEMS);

    p5.push();
    p5.scale(this.scaleAmountX, this.scaleAmountY);

    if (this.isWalkBehindPosition(p5, fervie.getFervieFootX(), fervie.getFervieFootY())) {
      p5.image(walkBehindItems, 0, 0);
    }

    if (this.isFervieSittingDown(p5, fervie)) {
      fervie.hide();
      this.moovieFervieSprite.draw(p5);

      let chairArm = this.animationLoader.getStaticImage(p5, HouseInsideBedroom.CHAIR_OVERLAY);
      p5.image(chairArm, 0, 0);
    }

    if (this.ladyFervieSprite.isFervieBehindLady(fervie, this.scaleAmountY, this.scaleAmountY)) {
      this.ladyFervieSprite.draw(p5);
    }

    p5.pop();
  }

  isOverLady(x, y) {
    return this.ladyFervieSprite.isOverLady(this.getScaledX(x), this.getScaledY(y));
  }

  isFervieSittingDown(p5, fervie) {
    return false;
  }

  drawFire(p5) {
    let fireImage = this.animationLoader.getStaticImage(p5, HouseInsideBedroom.FIREPLACE_GIF);
    p5.image(fireImage, 716, 285);
  }

  mousePressed(p5, fervie) {

    let x = p5.mouseX;
    let y = p5.mouseY;

    if (this.isOverLady(x, y) && this.ladyFervieSprite.isNextToLady(fervie, this.scaleAmountX, this.scaleAmountY)) {
      if (!fervie.isKissing) {
        this.kissAnimation(fervie);
      }
    }
  }

  kissAnimation(fervie) {
    if (this.ladyFervieSprite.isToLeftOfLady(fervie.getFervieFootX(), this.scaleAmountX)) {
      fervie.kissMirror();
      this.ladyFervieSprite.loveMirror();
    } else {
      fervie.kiss();
      this.ladyFervieSprite.love();
    }

    setTimeout(() => {
      fervie.stopKissing();
      this.ladyFervieSprite.neutral();
    }, 2000);
  }

  /**
   * Update the environment according to where fervie has moved
   */
  update(p5, fervie) {
    super.update(p5);

    this.moovieFervieSprite.update(p5);
    this.ladyFervieSprite.update(p5);
  }
}
