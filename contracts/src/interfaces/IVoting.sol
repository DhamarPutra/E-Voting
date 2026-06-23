// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IVotingErrors.sol";
import "./IVotingEvents.sol";

interface IVoting is IVotingErrors, IVotingEvents {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct VotingEvent {
        uint256 id;
        string title;
        bool isActive;
    }

    function createVotingEvent(string calldata title, string[] calldata candidateNames) external;
    
    function castVote(bytes32 nikHash, uint256 candidateId) external;
    
    function endVotingEvent(uint256 eventId) external;
    
    function getResults(uint256 eventId) external view returns (Candidate[] memory);
    
    function hasVoted(uint256 eventId, bytes32 nikHash) external view returns (bool);
    
    function getCurrentEventId() external view returns (uint256);
    
    function getVotingEvent(uint256 eventId) external view returns (VotingEvent memory);
}
