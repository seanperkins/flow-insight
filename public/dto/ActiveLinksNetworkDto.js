//
// dto class for ActiveLinksNetworkDto
//
module.exports = class ActiveLinksNetworkDto {
  constructor(json) {
    try {
      if (typeof json === "string") json = JSON.parse(json);

      this.networkId = json.networkId;
      this.sparkLinks = json.sparkLinks;
    } catch (e) {
      throw new Error(
        "Unable to create dto 'XPSummaryDto' : " + e.message
      );
    }
  }

  isValid() {
    if (this.sparkLinks != null && this.sparkLinks != null)
      return true;
    return false;
  }
};
