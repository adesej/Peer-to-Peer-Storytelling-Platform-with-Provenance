# 📖 Peer-to-Peer Storytelling Platform with Provenance

Welcome to a decentralized revolution in storytelling! This Web3 project builds a peer-to-peer platform on the Stacks blockchain where creators can share, remix, and monetize stories with unbreakable provenance tracking. Say goodbye to plagiarism, lost attributions, and centralized censorship—every tale has an immutable history.

## 🌍 Real-World Problem Solved

In today's digital world, stories, folklore, and user-generated narratives are vulnerable to copying, alteration, or erasure without credit. Centralized platforms like social media or publishing sites control content, often leading to unfair monetization, data silos, and loss of creator rights. This platform empowers creators with blockchain provenance to prove originality, enable fair remixing, and ensure automatic royalties, fostering a collaborative, open storytelling ecosystem.

## ✨ Features

📜 Create and mint original stories as NFTs with timestamps  
🔗 Track provenance for remixes, forks, and collaborations  
💰 Automatic royalty distribution on sales or derivatives  
🤝 Peer-to-peer sharing and community voting for curation  
🛡️ Immutable ownership verification to prevent disputes  
💸 Token-based rewards for popular contributions  
🔍 Searchable story registry with metadata  
🚫 Anti-plagiarism checks via unique hashes  

## 🛠 Tech Stack

Built with Clarity smart contracts on the Stacks blockchain for secure, scalable execution. The project involves 8 interconnected smart contracts to handle various aspects of the platform.

### Smart Contracts Overview

1. **UserRegistry.clar**: Handles user registration, profiles, and authentication via STX addresses.  
2. **StoryNFT.clar**: Mints stories as non-fungible tokens (NFTs) with embedded metadata like title, content hash, and creation timestamp.  
3. **ProvenanceTracker.clar**: Records the lineage of stories, including parent-child relationships for remixes and forks.  
4. **RemixContract.clar**: Allows users to create derivative stories, linking back to originals and enforcing attribution.  
5. **RoyaltyDistributor.clar**: Manages automatic royalty splits (e.g., 10% to original creators) on sales or remixes using fungible tokens.  
6. **Marketplace.clar**: Facilitates buying, selling, and auctioning of story NFTs with built-in escrow.  
7. **VotingCuration.clar**: Enables community voting on stories using governance tokens to feature top content.  
8. **RewardPool.clar**: Distributes STX or custom tokens as rewards based on engagement metrics like views or upvotes.

## 🚀 How It Works

**For Story Creators**  
- Register your profile using UserRegistry.  
- Generate a SHA-256 hash of your story content.  
- Call StoryNFT's mint-story function with:  
  - Story hash  
  - Title and description  
  - Optional media links  
Your story is now an NFT with a timestamped entry in ProvenanceTracker—proven original!

**For Remixers and Collaborators**  
- Find a story via the registry.  
- Use RemixContract to create a derivative:  
  - Reference the parent story ID  
  - Add your new content hash  
This auto-links provenance and triggers RoyaltyDistributor for fair shares.

**For Buyers and Collectors**  
- Browse via Marketplace: list-stories or search by keywords.  
- Purchase NFTs with STX; royalties flow instantly to creators.  
- Verify ownership anytime with StoryNFT's verify-owner.

**For Community Members**  
- Stake tokens in VotingCuration to upvote stories.  
- Earn rewards from RewardPool based on your contributions' popularity.  
- All interactions are P2P, with no central authority—pure decentralization!

## 📚 Getting Started

1. Set up a Stacks wallet (e.g., Hiro Wallet).  
2. Deploy the contracts using Clarity tools.  
3. Interact via a frontend DApp (build your own or use our sample React app).  
4. Start storytelling—your words, immortalized on the blockchain!

This project not only solves attribution issues but also creates a vibrant, incentivized community for global narratives. Fork it, remix it, and let's build the future of stories together! 🚀