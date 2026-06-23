// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVotingErrors {
    error OnlyAdmin();
    error VotingNotActive();
    error AlreadyVoted();
    error InvalidCandidate();
    error EventDoesNotExist();
    error VotingAlreadyEnded();
}
