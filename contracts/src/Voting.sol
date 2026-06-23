// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IVoting.sol";

contract Voting is IVoting {
    address public admin;
    uint256 public currentEventId;

    mapping(uint256 => VotingEvent) private _events;
    mapping(uint256 => Candidate[]) private _eventCandidates;
    mapping(uint256 => mapping(bytes32 => bool)) private _voted;

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createVotingEvent(string calldata title, string[] calldata candidateNames) external override onlyAdmin {
        // If there's an ongoing active event, end it or let it run.
        // For simplicity, we can let them run or end them manually, but here we just increment eventId.
        currentEventId++;
        
        VotingEvent storage newEvent = _events[currentEventId];
        newEvent.id = currentEventId;
        newEvent.title = title;
        newEvent.isActive = true;

        for (uint256 i = 0; i < candidateNames.length; i++) {
            _eventCandidates[currentEventId].push(Candidate({
                id: i,
                name: candidateNames[i],
                voteCount: 0
            }));
        }

        emit VotingEventCreated(currentEventId, title, candidateNames.length);
    }

    function castVote(bytes32 nikHash, uint256 candidateId) external override onlyAdmin {
        uint256 eventId = currentEventId;
        if (eventId == 0 || !_events[eventId].isActive) revert VotingNotActive();
        if (_voted[eventId][nikHash]) revert AlreadyVoted();
        if (candidateId >= _eventCandidates[eventId].length) revert InvalidCandidate();

        _voted[eventId][nikHash] = true;
        _eventCandidates[eventId][candidateId].voteCount++;

        emit VoteCast(eventId, nikHash, candidateId);
    }

    function endVotingEvent(uint256 eventId) external override onlyAdmin {
        if (eventId == 0 || eventId > currentEventId) revert EventDoesNotExist();
        if (!_events[eventId].isActive) revert VotingNotActive();

        _events[eventId].isActive = false;

        emit VotingEventEnded(eventId);
    }

    function getResults(uint256 eventId) external view override returns (Candidate[] memory) {
        if (eventId == 0 || eventId > currentEventId) revert EventDoesNotExist();
        return _eventCandidates[eventId];
    }

    function hasVoted(uint256 eventId, bytes32 nikHash) external view override returns (bool) {
        if (eventId == 0 || eventId > currentEventId) revert EventDoesNotExist();
        return _voted[eventId][nikHash];
    }

    function getCurrentEventId() external view override returns (uint256) {
        return currentEventId;
    }

    function getVotingEvent(uint256 eventId) external view override returns (VotingEvent memory) {
        if (eventId == 0 || eventId > currentEventId) revert EventDoesNotExist();
        return _events[eventId];
    }
}
