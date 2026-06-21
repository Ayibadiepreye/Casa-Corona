
import { io } from "socket.io-client";

const base = "http://localhost:3001/api/v1";

async function login(email, password) {
  const r = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  console.log("Login response for", email, ":", data);
  return data.data.accessToken;
}

async function createConversation(customerToken, vendorId) {
  const r = await fetch(`${base}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ vendorId }),
  });
  const data = await r.json();
  console.log("Create conv response:", data);
  return data.data.conversation.id; // Because controller returns { conversation }
}

async function main() {
  console.log("Getting vendor token...");
  const vToken = await login("vendor_t4@demo.com", "password123");
  console.log("Getting customer token...");
  const cToken = await login("customer_t7v@demo.com", "password123");
  const vid = "e772b740-b78d-4980-8f95-865f83750e24";
  console.log("Creating conversation...");
  const convId = await createConversation(cToken, vid);
  console.log("Conversation ID:", convId);
  if (!convId) {
    console.error("Failed to get conversation ID!");
    process.exit(1);
  }

  // Connect sockets
  const customerSocket = io("http://localhost:3001", { auth: { token: cToken } });
  const vendorSocket = io("http://localhost:3001", { auth: { token: vToken } });

  let vendorGotMessage = null;

  vendorSocket.on("connect", () => {
    console.log("VENDOR CONNECTED");
    vendorSocket.emit("conversation:join", { conversationId: convId });
  });

  customerSocket.on("connect", () => {
    console.log("CUSTOMER CONNECTED");
    customerSocket.emit("conversation:join", { conversationId: convId });
    setTimeout(() => {
      console.log("Customer sending message...");
      customerSocket.emit("message:send", {
        conversationId: convId,
        content: "Phase 6 verification message",
      });
    }, 500);
  });

  vendorSocket.on("message:new", (msg) => {
    console.log("VENDOR GOT:", msg.content);
    vendorGotMessage = msg;
  });

  setTimeout(async () => {
    if (vendorGotMessage && vendorGotMessage.content === "Phase 6 verification message") {
      console.log("✅ REAL-TIME TEST PASSED");
    } else {
      console.log("❌ REAL-TIME TEST FAILED");
    }
    customerSocket.disconnect();
    vendorSocket.disconnect();
    process.exit(0);
  }, 3000);
}

main().catch(console.error);
