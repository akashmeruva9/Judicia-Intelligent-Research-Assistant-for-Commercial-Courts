# Judicia: AI-Driven Research Engine for Commercial Courts

![Project Banner](banner-image-link)

## Overview

Judicia is an intelligent AI-powered research assistant specifically designed for commercial courts. This project was built as part of the **Smart India Hackathon 2024** (Problem Statement ID: SIH 1701), addressing the need for an **AI-Driven Research Engine** to improve legal research and judicial processes. Our solution leverages advanced AI technologies, including **BERT NLP**, **Graph Neural Networks (GNNs)**, and **Blockchain Auditing**, to streamline and enhance legal research across jurisdictions.

---

## Problem Statement

- **Title:** AI-Driven Research Engine for Commercial Courts
- **Category:** Software
- **Theme:** Smart Automation
- **Team Name:** Ritorno
- **Team ID:** 38233

---

## Key Features

1. **Easy-to-Use Interface:** A user-friendly web UI that simplifies interaction with complex AI-driven legal research systems.
2. **BERT-Powered NLP:** Utilizes BERT models to interpret and process legal texts, ensuring context-aware and accurate research outcomes.
3. **Graph Neural Networks (GNNs):** Analyzes relationships between legal cases and principles to offer deep insights into legal precedents.
4. **Blockchain Auditing:** Guarantees transparency with an immutable blockchain audit trail for all legal research activities.
5. **Multilingual AI Support:** Supports translation of legal documents in regional languages.
6. **Multi-Jurisdictional Research:** Adapts to standards across High Courts, providing a unified platform for cross-jurisdictional research.
7. **Cloud Scalability:** Enables real-time processing of large legal datasets with cloud infrastructure.
8. **Ethical AI:** Adheres to ethical AI principles, ensuring transparency and unbiased legal research recommendations.
9. **Explainable AI:** Provides clear reasoning behind all legal insights and recommendations.
10. **Multimodal Learning:** Processes legal texts, audio, and images for comprehensive research capabilities.

---

## Technical Approach

Our solution is powered by a robust technical stack that ensures high performance, security, and scalability.

### Backend

- **Framework:** Python with FastAPI for creating high-performance REST APIs.
- **NLP:** BERT-based models using PyTorch for advanced natural language processing.
- **AI Models:** Graph Neural Networks (GNNs) built with TensorFlow for analyzing relationships between legal entities.
- **Blockchain:** Hyperledger/Ethereum for creating secure and immutable audit logs.
- **Database:** PostgreSQL for efficient and scalable data storage.

### Frontend

- **Framework:** React.js for building a responsive and intuitive user interface.
- **Server-Side Rendering (SSR):** Next.js for SEO optimization and faster rendering.
- **Multilingual Processing:** Integrated AI-powered translations for processing legal documents in various regional languages.

### Cloud Infrastructure

- **Platform:** Google Cloud/AWS for scalability and reliability.
- **Deployment:** Containerized using Docker and orchestrated with Kubernetes.

### Security and Privacy

- **Federated Learning:** Secures legal data processing across jurisdictions without central data sharing.
- **Encryption:** End-to-end encryption ensures data privacy and security throughout the research process.

---

## Development Strategy

- **Agile Development:** Iterative, sprint-based development to ensure continuous improvements and quick turnarounds.
- **CI/CD Pipeline:** Integrated testing, deployment, and monitoring using a Continuous Integration/Continuous Deployment pipeline.
- **Horizontal Scaling:** Enables the system to handle high volumes of data and traffic with real-time legal insights.

---

## Code Explanation

Here's a breakdown of the core components of our system using key code snippets:

### `AutogenAgent`

The `AutogenAgent` class is at the core of managing the creation and communication between human agents, assistant agents, and group chat managers during mediation.

```python
class AutogenAgent(BaseModel):
    @staticmethod
    def __create_human_agents(room: Room):
        room = room.get_parent_room() or room
        participants = room.participants()
        humans: Dict[str, UserProxyAgent] = {}
        params = (
            {
                "llm_config": llm_config,
                "is_termination_msg": lambda message: (
                    CONFIG["caucuses"]["termination_phrase"] in message["content"]
                    or CONFIG["mediation_group"]["resolution_phrase"] in message["content"]
                    or CONFIG["mediation_group"]["termination_phrase"] in message["content"]
                ),
            }
            if TESTING_MODE
            else {"llm_config": False, "is_termination_msg": lambda _: True}
        )
        for participant in participants:
            participant_profile = participant.profile
            key = str(participant_profile.email)
            # Retrieve and format behavioral traits
            behavioral_traits = get_behavioral_info(participant_profile.email)
            formatted_traits = format_traits(behavioral_traits)
            humans[key] = UserProxyAgent(
                participant_profile.username,
                description=CONFIG["humans"]["description"](participant_profile)
                + f"\nBehavioral Traits: {formatted_traits}",
                human_input_mode="NEVER",
                code_execution_config={"use_docker": False},
                system_message=CONFIG["humans"]["system"](participant_profile)
                + f"\nBehavioral Traits: {formatted_traits}",
                **params,
            )
        return humans
```

This function creates human agents for each participant in a room and configures the agent based on behavioral traits derived from JSON data.

### `send_message`

This method facilitates communication between agents during the mediation process by sending and receiving messages.

```python
@classmethod
def send_message(cls,
    room: Room,
    sender: ConversableAgent,
    recipient: GroupChatManager,
    content: str,
    agents: RoomAgents,
    ignore_initial_message=False,):
    
    room = room.get_parent_room() or room
    room_name = recipient.name
    room_to_send = room
    email = cls.__get_email_from_agent(sender) or room.creator_email

    if room_name.endswith("_caucus"):
        breakouts = room.get_breakout_rooms()
        room_to_send = breakouts[email]

    if not ignore_initial_message:
        Message.send_message(
            room_code=room_to_send.room_code,
            email=email,
            role=cls.__get_role_from_agent_name(sender.name),
            content=content,
        )

    pre_count = len(recipient.chat_messages[sender])

    sender.initiate_chat(
        recipient,
        clear_history=False,
        message=content,
    )

    new_messages = recipient.chat_messages[sender][pre_count + 1:]

    for message in new_messages:
        agent = cls.__get_agent_by_name(room_agents=agents, name=message["name"])
        Message.send_message(
            room_code=room_to_send.room_code,
            email=cls.__get_email_from_agent(agent) or room.creator_email,
            role=cls.__get_role_from_agent_name(message["name"]),
            content=message["content"],
        )
```

This method sends a message from one agent to another while logging the conversation. It manages different agents (human, assistant, mediator) within the mediation process.

## How It Works

1. **User Query:** Users submit legal queries through the web interface.
2. **NLP & Case Analysis:** The BERT model processes the query to understand its legal context and performs an AI-powered search through legal databases.
3. **Legal Precedents & Insights:** GNNs analyze relationships between cases and legal principles, offering relevant case law and deeper insights.
4. **Transparent Results:** Blockchain audit logs ensure that the research process is transparent, and explainable AI techniques provide reasoning behind every recommendation.
5. **Multilingual Support:** The platform translates legal documents in regional languages to ensure inclusivity and accessibility.

## Impact and Benefits

### Potential Impact

- **Faster Case Resolution:** Expedited legal research accelerates case proceedings and assists judges in making informed decisions.
- **Improved Accuracy:** AI-powered insights reduce human error and inconsistencies in legal research.
- **Increased Access to Justice:** The platform enhances access to legal research across multiple jurisdictions and languages.

### Industry Benefits

- **Judicial Efficiency:** Enhances the performance of commercial courts, creating a more business-friendly legal environment.
- **Standard Setting:** Establishes new benchmarks for AI-driven legal research, influencing future developments in the judiciary.

## Tech Stack

- **Backend:** Python (FastAPI), PyTorch (NLP), TensorFlow (GNNs)
- **Frontend:** React.js, Next.js
- **Blockchain:** Hyperledger/Ethereum
- **Database:** PostgreSQL
- **Cloud:** Google Cloud/AWS
- **Containerization:** Docker, Kubernetes
- **AI Models:** BERT, Graph Neural Networks

## Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- Docker
- PostgreSQL
- Google Cloud/AWS account

### Setup Instructions

1. Clone the Repository:
   ```bash
   git clone https://github.com/your-repo/judicia.git
   cd judicia
   ```

2. Backend Setup:
   - Install the dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Set up the database:
     ```bash
     psql -U postgres -d judicia -f db/schema.sql
     ```
   - Run the FastAPI server:
     ```bash
     uvicorn main:app --reload
     ```

3. Frontend Setup:
   - Install the dependencies:
     ```bash
     npm install
     ```
   - Start the frontend server:
     ```bash
     npm run dev
     ```

4. Docker Setup (Optional):
   - Build and run the containers:
     ```bash
     docker-compose up --build
     ```

## Research and References

- [BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805)
- [Graph Neural Networks](https://arxiv.org/abs/1812.08434)
- [Federated Learning: Challenges, Methods, and Future Directions](https://arxiv.org/abs/1908.07873)
- [Explainable AI: Understanding, Visualizing and Interpreting Deep Learning Models](https://arxiv.org/abs/1708.08296)

## Conclusion

Judicia represents a groundbreaking step in the integration of AI technologies in legal research, specifically tailored for commercial courts. By enhancing research accuracy, ensuring transparency, and providing multilingual support, Judicia aims to transform how legal professionals conduct their research, ultimately improving the judicial process in commercial disputes.
