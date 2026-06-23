// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVotingEvents {
    event VotingEventCreated(uint256 indexed eventId, string title, uint256 candidateCount);
    event VoteCast(uint256 indexed eventId, bytes32 indexed nikHash, uint256 indexed candidateId);
    event VotingEventEnded(uint256 indexed eventId);
}
