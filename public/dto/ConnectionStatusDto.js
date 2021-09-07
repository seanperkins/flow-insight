/**
 * dto class for SimpleStatus
 * @type {ConnectionStatusDto}
 */
module.exports = class ConnectionStatusDto {
  constructor(json) {
    try {
      if (typeof json === "string") json = JSON.parse(json);
      this.message = json.message;
      this.status = json.status;
      this.connectionId = json.connectionId;
      this.organizationId = json.organizationId;
      this.teamId = json.teamId;
      this.memberId = json.memberId;
      this.participatingOrganizations = json.participatingOrganizations;

    } catch (e) {
      throw new Error(
        "Unable to create dto 'ConnectionStatusDto' : " +
          e.message
      );
    }
  }

  isValid() {
    if (this.status === "VALID") return true;
    return false;
  }
};
