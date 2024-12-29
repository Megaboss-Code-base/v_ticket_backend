"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("events", "ticketType", {
      type: Sequelize.JSONB,
      allowNull: false,
      validate: {
        isValidArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("ticketType must be an array");
          }
          value.forEach((ticket) => {
            if (
              typeof ticket.name !== "string" ||
              typeof ticket.quantity !== "string" ||
              typeof ticket.sold !== "string" ||
              typeof ticket.price !== "string"
            ) {
              throw new Error(
                "Each ticketType entry must include valid name, quantity, sold, and price as strings"
              );
            }
            if (ticket.details && typeof ticket.details !== "string") {
              throw new Error(
                "ticketType details must be a string if provided"
              );
            }
            if (ticket.attendees && !Array.isArray(ticket.attendees)) {
              throw new Error(
                "ticketType attendees must be an array if provided"
              );
            }
            if (ticket.attendees) {
              ticket.attendees.forEach((attendee) => {
                if (
                  typeof attendee.name !== "string" ||
                  typeof attendee.email !== "string"
                ) {
                  throw new Error(
                    "Each attendee must include a valid name and email as strings"
                  );
                }
              });
            }
          });
        },
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("events", "ticketType", {
      type: Sequelize.JSONB,
      allowNull: false,
      validate: {
        isValidArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("ticketType must be an array");
          }
          value.forEach((ticket) => {
            if (
              typeof ticket.name !== "string" ||
              typeof ticket.quantity !== "string" ||
              typeof ticket.sold !== "string" ||
              typeof ticket.price !== "string"
            ) {
              throw new Error(
                "Each ticketType entry must include valid name, quantity, sold, and price as strings"
              );
            }
          });
        },
      },
    });
  },
};
