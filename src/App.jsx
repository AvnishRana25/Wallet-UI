import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  Text,
  useToast,
  Input,
  HStack,
  Spinner,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
  useColorModeValue,
  Flex,
  Image,
  Tag,
  extendTheme,
  ChakraProvider,
  Divider,
  Icon,
  Select,
  CloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  Textarea,
  FormHelperText,
} from "@chakra-ui/react";
import {
  CopyIcon,
  ArrowForwardIcon,
  ArrowBackIcon,
  CloseIcon,
  CheckCircleIcon,
} from "@chakra-ui/icons";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useMemo } from "react";
import {
  createRpc,
  buildAndSignTx,
  sendAndConfirmTx,
} from "@lightprotocol/stateless.js";
import {
  CompressedTokenProgram,
  selectMinCompressedTokenAccountsForTransfer,
} from "@lightprotocol/compressed-token";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
// import solanaWebP from "./assets/solana.webp"; // Old logo
import solanaSvg from "./assets/solana.svg"; // New Solana SVG logo

// Metaplex Umi imports
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  fonts: {
    heading: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    body: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  },
  colors: {
    brand: {
      50: "#fff6e0",
      100: "#ffecb3",
      200: "#ffe180",
      300: "#ffd74d",
      400: "#ffcd1a",
      500: "#ffbf00",
      600: "#e6ac00",
      700: "#b38600",
      800: "#805f00",
      900: "#4d3900",
    },
    cardBg: "rgba(35, 35, 35, 0.75)",
    cardBorder: "rgba(255, 255, 255, 0.1)",
  },
  styles: {
    global: (props) => ({
      body: {
        bg: "#121212", // Slightly less black for a softer feel
        color: "whiteAlpha.900",
        lineHeight: "1.6",
      },
      "*::placeholder": {
        color: "whiteAlpha.700",
      },
    }),
  },
  components: {
    Button: {
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === "brand" ? "brand.500" : undefined,
          color: props.colorScheme === "brand" ? "gray.800" : undefined, // Darker text on brand buttons
          fontWeight: props.colorScheme === "brand" ? "semibold" : "medium",
          _hover: {
            bg: props.colorScheme === "brand" ? "brand.600" : undefined,
            transform:
              props.colorScheme === "brand" ? "scale(1.03)" : undefined,
            boxShadow: props.colorScheme === "brand" ? "md" : undefined,
          },
          transition:
            "transform 0.15s ease-out, background-color 0.15s ease-out, box-shadow 0.15s ease-out",
        }),
        outline: (props) => ({
          borderColor:
            props.colorScheme === "brand" ? "brand.500" : "whiteAlpha.400",
          color: props.colorScheme === "brand" ? "brand.400" : "whiteAlpha.800",
          _hover: {
            bg: props.colorScheme === "brand" ? "brand.500" : "whiteAlpha.200",
            color:
              props.colorScheme === "brand" ? "gray.800" : "whiteAlpha.900",
          },
        }),
      },
      defaultProps: {
        size: "md",
        borderRadius: "lg", // Slightly more rounded buttons
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderColor: "whiteAlpha.400",
          bg: "whiteAlpha.100",
          _hover: {
            borderColor: "whiteAlpha.500",
          },
          _focus: {
            borderColor: "brand.500",
            boxShadow: `0 0 0 1px #ffbf00`,
          },
          _placeholder: {
            // This targets the input field's placeholder specifically
            color: "gray.500",
          },
        },
      },
      sizes: {
        md: {
          field: {
            borderRadius: "lg", // Match button rounding
          },
          addon: {
            borderRadius: "lg",
          },
        },
        sm: {
          field: {
            borderRadius: "md", // Slightly less for sm inputs
          },
          addon: {
            borderRadius: "md",
          },
        },
      },
      defaultProps: {
        variant: "filled",
      },
    },
    Container: {
      baseStyle: {
        maxW: "container.xl",
        px: { base: 4, md: 6 },
      },
    },
    Heading: {
      baseStyle: {
        fontWeight: "700",
      },
    },
    Card: {
      baseStyle: {
        bg: "cardBg",
        borderRadius: "xl",
        border: "1px solid",
        borderColor: "cardBorder",
        boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.15)",
        backdropFilter: "blur(10px)",
        p: 6,
      },
    },
  },
});

// Helper for consistent card styling
const cardStyles = {
  bg: "cardBg",
  borderRadius: "xl",
  border: "1px solid",
  borderColor: "cardBorder",
  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
  backdropFilter: "blur(12px)",
  p: { base: 5, md: 6 },
  width: "100%",
};

function App() {
  const { publicKey, connected, signTransaction, disconnect } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState(null);
  const [compressedBalance, setCompressedBalance] = useState(null);

  // Mint management state
  const [mintInput, setMintInput] = useState(""); // For the input field
  const [savedMints, setSavedMints] = useState([]); // Array of { address: string, name?: string }
  const [selectedMint, setSelectedMint] = useState(""); // The currently active mint address

  const [loading, setLoading] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const toast = useToast();
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const subtleText = useColorModeValue("gray.600", "gray.400");
  const cardBackgroundColor = useColorModeValue("whiteAlpha.50", "cardBg");

  const {
    isOpen: isInfoOpen,
    onOpen: onInfoOpen,
    onClose: onInfoClose,
  } = useDisclosure();

  useEffect(() => {
    try {
      const storedMints = localStorage.getItem("savedMints");
      if (storedMints) {
        const parsedMints = JSON.parse(storedMints);
        setSavedMints(parsedMints);
        if (parsedMints.length > 0 && !selectedMint) {
          setSelectedMint(parsedMints[0].address); // Select the first mint by default if none is selected
        }
      }
    } catch (error) {
      console.error("Error loading saved mints from localStorage:", error);
      // Optionally, clear corrupted data: localStorage.removeItem("savedMints");
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save savedMints to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("savedMints", JSON.stringify(savedMints));
    } catch (error) {
      console.error("Error saving mints to localStorage:", error);
    }
  }, [savedMints]);

  const handleAddMint = () => {
    if (!mintInput.trim()) {
      toast({
        title: "Mint address cannot be empty.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    try {
      new PublicKey(mintInput.trim()); // Validate format
    } catch (e) {
      toast({
        title: "Invalid mint address format.",
        status: "error",
        duration: 3000,
      });
      return;
    }
    if (savedMints.some((m) => m.address === mintInput.trim())) {
      toast({
        title: "Mint address already saved.",
        status: "info",
        duration: 3000,
      });
      return;
    }
    const newMint = { address: mintInput.trim() }; // Can add a name field later if desired
    setSavedMints((prevMints) => [...prevMints, newMint]);
    setSelectedMint(newMint.address); // Optionally select the newly added mint
    setMintInput(""); // Clear input field
    toast({ title: "Mint address added!", status: "success", duration: 2000 });
  };

  const handleRemoveMint = (addressToRemove) => {
    setSavedMints((prevMints) =>
      prevMints.filter((m) => m.address !== addressToRemove)
    );
    if (selectedMint === addressToRemove) {
      setSelectedMint(
        savedMints.length > 1
          ? savedMints.find((m) => m.address !== addressToRemove).address
          : ""
      );
      // If the removed mint was selected, select another one or clear selection
      setCompressedBalance(null); // Clear data when selection changes
      setTokenMetadata(null);
    }
    toast({ title: "Mint address removed.", status: "info", duration: 2000 });
  };

  const handleSelectMint = (addressToSelect) => {
    if (addressToSelect && addressToSelect !== selectedMint) {
      setSelectedMint(addressToSelect);
      // Data fetching will be triggered by the "Check" button or automatically if desired
      // For now, just update the selection. Clear old data.
      setCompressedBalance(null);
      setTokenMetadata(null);
      setLoading(false); // Reset loading states
      setIsMetadataLoading(false);
      // Automatically fetch data for the newly selected mint if user prefers
      // fetchTokenData(); // Uncomment this line to auto-fetch on select
    }
  };

  const umi = useMemo(() => {
    if (!connection) return null;
    return createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
  }, [connection]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        try {
          const bal = await connection.getBalance(publicKey);
          setSolBalance(bal / 1e9);
        } catch (e) {
          toast({
            title: "Error fetching SOL balance",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        setSolBalance(null);
      }
    };
    fetchBalance();
  }, [publicKey, connection, toast]);

  const fetchTokenData = async () => {
    if (!publicKey || !umi) {
      setCompressedBalance(null);
      setTokenMetadata(null);
      console.log(
        "fetchTokenData: Aborted due to missing publicKey or umi instance.",
        { publicKey: !!publicKey, umi: !!umi }
      );
      return;
    }

    if (!selectedMint) {
      toast({
        title: "No Mint Selected",
        description: "Please select or add a token mint address.",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      setIsMetadataLoading(false);
      return;
    }

    try {
      new PublicKey(selectedMint);
      console.log(
        "fetchTokenData: Selected mint string (",
        selectedMint,
        ") appears to be a valid PublicKey format."
      );
    } catch (e) {
      console.error(
        "fetchTokenData: Invalid selected mint address:",
        selectedMint,
        e
      );
      toast({
        title: "Invalid Mint Address Selected",
        description: `The address "${selectedMint.slice(
          0,
          20
        )}..." is not valid. Please remove it or select a valid one.`,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      setIsMetadataLoading(false);
      setCompressedBalance(null);
      setTokenMetadata(null);
      return;
    }

    console.log("fetchTokenData: Starting after mint validation", {
      publicKey: publicKey?.toBase58(),
      mint: selectedMint,
      umiConnected: !!umi,
      rpcEndpoint: connection.rpcEndpoint,
    });
    setLoading(true);
    setIsMetadataLoading(true);
    setCompressedBalance(null);
    setTokenMetadata(null);

    try {
      console.log("fetchTokenData: Attempting to fetch compressed balance...");
      const rpc = createRpc(connection.rpcEndpoint);
      const accounts = await rpc.getCompressedTokenAccountsByOwner(
        publicKey.toBase58(),
        { mint: selectedMint }
      );
      console.log("fetchTokenData: Compressed balance fetched", accounts);
      const total = accounts.items.reduce(
        (acc, item) => acc + Number(item.amount),
        0
      );
      setCompressedBalance(total);
      setLoading(false); // Balance fetching part done

      console.log("fetchTokenData: Attempting to fetch token metadata...");
      try {
        const mintPublicKeyForUmi = umiPublicKey(selectedMint);
        console.log(
          "fetchTokenData: Umi mint public key created",
          mintPublicKeyForUmi.toString()
        );
        const asset = await fetchDigitalAsset(umi, mintPublicKeyForUmi);
        console.log("fetchTokenData: Digital asset fetched", asset);

        let offChainMetadata = {};
        if (asset.metadata.uri) {
          console.log(
            "fetchTokenData: Fetching off-chain metadata from URI:",
            asset.metadata.uri
          );
          try {
            const response = await fetch(asset.metadata.uri);
            if (!response.ok) {
              console.warn(
                `fetchTokenData: Failed to fetch URI ${asset.metadata.uri}: ${response.statusText} (status ${response.status})`
              );
            } else {
              offChainMetadata = await response.json();
              console.log(
                "fetchTokenData: Off-chain metadata fetched",
                offChainMetadata
              );
            }
          } catch (uriError) {
            console.warn(
              "fetchTokenData: Error fetching or parsing off-chain metadata URI:",
              uriError
            );
            // Proceed with on-chain metadata even if off-chain fails
          }
        } else {
          console.log("fetchTokenData: No off-chain URI present in metadata.");
        }

        const metadataToSet = {
          name: asset.metadata.name,
          symbol: asset.metadata.symbol,
          uri: asset.metadata.uri,
          image: offChainMetadata.image, // From off-chain JSON
          description: offChainMetadata.description, // From off-chain JSON
        };
        console.log(
          "fetchTokenData: Preparing to set token metadata",
          metadataToSet
        );
        setTokenMetadata(metadataToSet);
        console.log("fetchTokenData: Token metadata set.");
      } catch (metaError) {
        console.error(
          "fetchTokenData: Error in Umi metadata fetching/processing part:",
          metaError
        );
        setTokenMetadata(null); // Clear or set to a specific error state if needed
        toast({
          title: "Metadata Not Found",
          description:
            metaError.message ||
            "Could not fetch metadata for this mint. It might be a new or non-standard token.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (e) {
      console.error(
        "fetchTokenData: Error in outer try block (likely Light Protocol or unhandled Umi issue):",
        e
      );
      toast({
        title: "Error Fetching Token Data",
        description: e.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setCompressedBalance(null);
      setTokenMetadata(null);
      setLoading(false); // Ensure loading is false on error
    }
    setIsMetadataLoading(false);
    console.log("fetchTokenData: Finished.");
    // setLoading is handled for balance, metadata has its own loader
  };

  // Send compressed tokens
  const handleSend = async () => {
    if (!publicKey || !selectedMint || !recipient || !sendAmount) return;
    setSendLoading(true);
    try {
      const RPC_ENDPOINT = connection.rpcEndpoint;
      const rpc = createRpc(RPC_ENDPOINT);
      const accounts = await rpc.getCompressedTokenAccountsByOwner(
        publicKey.toBase58(),
        { mint: selectedMint }
      );
      const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(
        accounts.items,
        BigInt(sendAmount)
      );
      const proof = await rpc.getValidityProof(
        inputAccounts.map((account) => account.compressedAccount.hash)
      );
      const tokenPoolInfos = await rpc.getTokenPoolInfos(selectedMint);
      const ix = await CompressedTokenProgram.transfer({
        payer: publicKey,
        owner: publicKey,
        inputCompressedTokenAccounts: inputAccounts,
        toAddress: recipient,
        amount: BigInt(sendAmount),
        tokenPoolInfos,
        recentInputStateRootIndices: proof.rootIndices,
        recentValidityProof: proof.compressedProof,
      });
      const { blockhash } = await connection.getLatestBlockhash();
      const tx = buildAndSignTx(
        [ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), ix],
        publicKey,
        blockhash,
        []
      );
      const signedTx = await signTransaction(tx);
      const sig = await sendAndConfirmTx(connection, signedTx);
      toast({
        title: "Transfer Successful!",
        description: `Signature: ${sig.substring(0, 20)}...`,
        status: "success",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
      setSendAmount("");
      setRecipient("");
      fetchTokenData();
    } catch (e) {
      toast({
        title: "Transfer Failed",
        description: e.message || e.toString(),
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "top-right",
      });
    }
    setSendLoading(false);
  };

  // Copy wallet address
  const handleCopy = async (textToCopy, title) => {
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: title || "Copied to clipboard!",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box
        minH="100vh"
        bg="#121212"
        color="whiteAlpha.900"
        backgroundImage="radial-gradient(circle at 50% 100%, rgba(255,180,0,0.05) 0%, rgba(18,18,18,0) 50%)"
        display="flex"
        flexDirection="column"
      >
        {/* Global Header */}
        <Box
          as="header"
          py={3}
          px={{ base: 4, md: 8 }}
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          bg="#121212"
          position="sticky"
          top={0}
          zIndex="sticky"
        >
          <Container maxW="container.xl">
            <Flex align="center" justify="space-between" minH="50px">
              <HStack spacing={3}>
                <Box
                  bg="brand.500"
                  w="32px"
                  h="32px"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  color="gray.800"
                  fontSize="md"
                >
                  ZK
                </Box>
                <Heading
                  as="h1"
                  size="md"
                  fontWeight="600"
                  letterSpacing="tight"
                >
                  ZK Token Wallet
                </Heading>
              </HStack>
              <HStack spacing={4}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onInfoOpen}
                  colorScheme="brand"
                  px={4}
                  fontSize="sm"
                  height="40px"
                >
                  Learn More
                </Button>
                <WalletMultiButton
                  style={{ height: "40px", fontSize: "14px" }}
                />
              </HStack>
            </Flex>
          </Container>
        </Box>

        {/* Main Content Area */}
        <Flex
          as="main"
          flex="1"
          direction="column"
          align="center"
          justifyContent="center"
          width="100%"
          py={{ base: 6, md: 10 }}
        >
          {!connected ? (
            <Container
              maxW={{ base: "container.sm", md: "container.md" }}
              textAlign="center"
            >
              <VStack spacing={{ base: 6, md: 8 }} width="100%">
                <Image
                  src={solanaSvg}
                  alt="Solana SVG Logo"
                  boxSize={{ base: "100px", md: "120px" }}
                  opacity={0.9}
                  mb={4}
                />
                <Heading
                  as="h2"
                  fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }}
                  fontWeight="extrabold"
                  lineHeight="1.2"
                >
                  Secure & Efficient Solana
                  <br />
                  <Text as="span" color={brandColor}>
                    Compressed Token Management
                  </Text>
                </Heading>
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  color={subtleText}
                  maxW="lg"
                >
                  Leverage the power of ZK-compression. Connect your wallet to
                  experience seamless and cost-effective token operations on
                  Solana.
                </Text>
                <Box pt={4}>
                  <Text fontSize="sm" color="gray.500">
                    Please connect your wallet using the button in the header.
                  </Text>
                </Box>
              </VStack>
            </Container>
          ) : (
            <Container maxW="container.md" width="100%">
              <VStack spacing={{ base: 5, md: 6 }} align="stretch" width="100%">
                <Box sx={cardStyles} bg={cardBackgroundColor}>
                  <VStack spacing={4} align="stretch">
                    <Flex justifyContent="space-between" alignItems="center">
                      <HStack>
                        <IconButton
                          icon={<ArrowBackIcon />}
                          size="sm"
                          aria-label="Disconnect wallet and go back"
                          onClick={() =>
                            disconnect().catch((err) =>
                              console.error("Disconnect error", err)
                            )
                          }
                          variant="ghost"
                          mr={2}
                          color="whiteAlpha.800"
                        />
                        <Tag size="sm" colorScheme="green" variant="solid">
                          Connected
                        </Tag>
                        <Text fontWeight="medium" fontSize="sm">
                          {publicKey?.toBase58().slice(0, 6)}...
                          {publicKey?.toBase58().slice(-4)}
                        </Text>
                        <IconButton
                          icon={<CopyIcon />}
                          size="xs"
                          aria-label="Copy Address"
                          onClick={() =>
                            handleCopy(
                              publicKey?.toBase58(),
                              "Wallet address copied!"
                            )
                          }
                          variant="ghost"
                        />
                      </HStack>
                      <Tag
                        size="md"
                        colorScheme="brand"
                        variant="outline"
                        fontWeight="bold"
                      >
                        {solBalance !== null ? (
                          `${solBalance.toFixed(4)} SOL`
                        ) : (
                          <Spinner size="xs" />
                        )}
                      </Tag>
                    </Flex>
                    <Divider borderColor="whiteAlpha.200" />
                    <FormControl>
                      <FormLabel
                        htmlFor="mintInput"
                        fontWeight="semibold" // More prominent label
                        fontSize="sm"
                        mb={2} // More space
                      >
                        Manage & Check Compressed Token
                      </FormLabel>
                      <InputGroup size="sm">
                        <Input
                          id="mintInput"
                          placeholder="Enter or paste new mint address"
                          value={mintInput}
                          onChange={(e) => setMintInput(e.target.value)}
                          onKeyPress={(event) => {
                            if (event.key === "Enter") {
                              handleAddMint();
                            }
                          }}
                        />
                        <InputRightElement width="auto" pr={1}>
                          <Button
                            h="1.75rem"
                            size="sm"
                            colorScheme="brand"
                            onClick={handleAddMint}
                            isDisabled={!mintInput.trim()}
                            mr={1}
                          >
                            Add Mint
                          </Button>
                          <Button
                            h="1.75rem"
                            size="sm"
                            variant="outline"
                            colorScheme="brand"
                            onClick={fetchTokenData}
                            isDisabled={
                              !selectedMint || loading || isMetadataLoading
                            }
                            isLoading={loading || isMetadataLoading}
                            loadingText="Fetching"
                          >
                            Check Selected
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    {savedMints.length > 0 && (
                      <FormControl mt={4}>
                        <FormLabel
                          htmlFor="selectMint"
                          fontWeight="semibold"
                          fontSize="sm"
                          mb={2}
                        >
                          Saved Mint Addresses
                        </FormLabel>
                        <HStack>
                          <Select
                            id="selectMint"
                            size="sm"
                            value={selectedMint}
                            onChange={(e) => handleSelectMint(e.target.value)}
                            placeholder="Select a saved mint"
                          >
                            {savedMints.map((m) => (
                              <option
                                key={m.address}
                                value={m.address}
                                style={{
                                  backgroundColor: "#2D3748",
                                  color: "white",
                                }}
                              >
                                {m.name ||
                                  `${m.address.slice(
                                    0,
                                    10
                                  )}...${m.address.slice(-6)}`}
                              </option>
                            ))}
                          </Select>
                          {selectedMint && (
                            <IconButton
                              icon={<CloseIcon />}
                              size="sm"
                              aria-label="Remove selected mint from saved list"
                              onClick={() => handleRemoveMint(selectedMint)}
                              variant="ghost"
                              colorScheme="red"
                              isDisabled={
                                !savedMints.some(
                                  (m) => m.address === selectedMint
                                )
                              }
                            />
                          )}
                        </HStack>
                      </FormControl>
                    )}

                    {compressedBalance !== null && (
                      <Box
                        mt={1}
                        p={3}
                        bg="blackAlpha.200"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                      >
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text fontWeight="semibold" fontSize="md">
                            {" "}
                            {/* Increased weight and size */}
                            Your Token Balance:
                          </Text>
                          <Text
                            fontSize="xl" // Larger balance display
                            fontWeight="bold"
                            color={brandColor}
                          >
                            {compressedBalance}
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {isMetadataLoading && (
                      <Spinner size="md" alignSelf="center" my={3} />
                    )}
                    {!isMetadataLoading && tokenMetadata && (
                      <Box mt={3} p={3} bg="blackAlpha.300" borderRadius="md">
                        <HStack spacing={4} align="flex-start">
                          {tokenMetadata.image && (
                            <Image
                              src={tokenMetadata.image}
                              alt={`${tokenMetadata.name} image`}
                              boxSize={{ base: "60px", md: "80px" }} // Slightly larger image
                              borderRadius="lg" // Consistent rounding
                              objectFit="cover"
                              border="1px solid"
                              borderColor="whiteAlpha.300"
                            />
                          )}
                          <VStack align="flex-start" spacing={1}>
                            <Heading
                              size={{ base: "sm", md: "md" }}
                              color={brandColor}
                              display="flex"
                              alignItems="center"
                            >
                              {" "}
                              {/* Larger heading */}
                              {tokenMetadata.name || "Unnamed Token"}
                              {tokenMetadata.symbol && (
                                <Tag
                                  size="sm"
                                  ml={2}
                                  variant="outline"
                                  colorScheme="gray"
                                >
                                  {" "}
                                  {/* Subtle tag */}
                                  {tokenMetadata.symbol}
                                </Tag>
                              )}
                            </Heading>
                            {tokenMetadata.description && (
                              <Text
                                fontSize={{ base: "xs", md: "sm" }} // Slightly larger description
                                color="gray.300" // Brighter for readability
                              >
                                {tokenMetadata.description}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </Box>
                    )}
                  </VStack>
                </Box>

                <Flex
                  gap={{ base: 5, md: 6 }}
                  direction={{ base: "column", md: "row" }}
                >
                  <Box sx={cardStyles} flex="1" bg={cardBackgroundColor}>
                    <VStack spacing={3} align="stretch">
                      <Heading
                        as="h3"
                        size="md" // Increase card title size
                        display="flex"
                        alignItems="center"
                        color="whiteAlpha.900"
                      >
                        <Icon
                          as={ArrowForwardIcon}
                          transform="rotate(-45deg)"
                          color="green.400"
                          mr={2}
                          boxSize={5}
                        />
                        Receive Tokens
                      </Heading>
                      <Divider borderColor="whiteAlpha.200" />
                      <FormControl>
                        <FormLabel
                          htmlFor="walletAddress"
                          fontWeight="medium"
                          fontSize="xs"
                          mb={1}
                        >
                          Your Wallet Address
                        </FormLabel>
                        <InputGroup size="sm">
                          <Input
                            id="walletAddress"
                            value={publicKey?.toBase58()}
                            isReadOnly
                            fontSize="xs"
                          />
                          <InputRightElement>
                            <IconButton
                              aria-label="Copy address"
                              icon={<CopyIcon />}
                              size="sm"
                              onClick={() =>
                                handleCopy(
                                  publicKey?.toBase58(),
                                  "Wallet address copied!"
                                )
                              }
                              variant="ghost"
                              colorScheme="brand"
                            />
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>
                    </VStack>
                  </Box>

                  <Box sx={cardStyles} flex="1" bg={cardBackgroundColor}>
                    <VStack spacing={3} align="stretch">
                      <Heading
                        as="h3"
                        size="md" // Increase card title size
                        display="flex"
                        alignItems="center"
                        color="whiteAlpha.900"
                      >
                        <Icon
                          as={ArrowForwardIcon}
                          color="orange.400"
                          mr={2}
                          boxSize={5}
                        />
                        Send Tokens
                      </Heading>
                      <Divider borderColor="whiteAlpha.200" />
                      <FormControl mb={1}>
                        <FormLabel
                          htmlFor="recipientAddress"
                          fontWeight="medium"
                          fontSize="xs"
                          mb={1}
                        >
                          Recipient Address
                        </FormLabel>
                        <Input
                          id="recipientAddress"
                          size="sm"
                          placeholder="Enter recipient's Solana address"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                        />
                      </FormControl>
                      <FormControl mb={2}>
                        <FormLabel
                          htmlFor="sendAmount"
                          fontWeight="medium"
                          fontSize="xs"
                          mb={1}
                        >
                          Amount
                        </FormLabel>
                        <Input
                          id="sendAmount"
                          size="sm"
                          placeholder="Number of tokens to send"
                          type="number"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                        />
                      </FormControl>
                      <Button
                        colorScheme="brand"
                        onClick={handleSend}
                        isLoading={sendLoading}
                        loadingText="Sending..."
                        isDisabled={
                          !recipient ||
                          !sendAmount ||
                          !selectedMint ||
                          compressedBalance === 0 ||
                          (compressedBalance !== null &&
                            Number(sendAmount) > compressedBalance)
                        }
                        leftIcon={<ArrowForwardIcon />}
                        mt={2}
                      >
                        Send Tokens
                      </Button>
                      {compressedBalance !== null &&
                        Number(sendAmount) > compressedBalance && (
                          <Text
                            fontSize="xs"
                            color="red.400"
                            textAlign="center"
                            mt={1}
                          >
                            Insufficient balance.
                          </Text>
                        )}
                    </VStack>
                  </Box>
                </Flex>
              </VStack>
            </Container>
          )}
        </Flex>

        {/* Global Footer */}
        <Box
          as="footer"
          textAlign="center"
          py={{ base: 3, md: 4 }}
          px={{ base: 4, md: 8 }}
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
        >
          <Text fontSize="xs" color="gray.500">
            ZK Compressed Token Wallet © {new Date().getFullYear()} • Powered by
            Light Protocol
          </Text>
        </Box>
      </Box>

      {/* Education Hub Modal */}
      <Modal
        isOpen={isInfoOpen}
        onClose={onInfoClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(5px)" />{" "}
        {/* Stronger blur */}
        <ModalContent
          bg={cardBackgroundColor}
          backdropFilter="blur(10px)"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          borderRadius="xl"
        >
          <ModalHeader
            borderBottomWidth="1px"
            borderColor="whiteAlpha.300"
            fontSize="xl"
            fontWeight="semibold"
          >
            {" "}
            {/* Header styling */}
            About ZK Compressed Tokens & This Wallet
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6} px={{ base: 4, md: 6 }}>
            <VStack spacing={5} align="stretch">
              <Heading size="lg" fontWeight="bold" color={brandColor}>
                Understanding ZK State Compression
              </Heading>{" "}
              {/* Modal Title */}
              <Text fontSize="md" lineHeight="tall">
                {" "}
                {/* Increased font size and line height */}
                Solana's state growth presents challenges for on-chain storage
                costs. State compression, leveraging technologies like Merkle
                trees and off-chain data storage (e.g., via IPFS or Arweave), is
                a powerful solution. By storing only a cryptographic root hash
                on-chain, the cost of minting and managing vast quantities of
                tokens or NFTs is dramatically reduced. Light Protocol is at the
                forefront of enabling these capabilities.
              </Text>
              <Divider borderColor="whiteAlpha.300" />
              <Heading size="md" fontWeight="semibold">
                Core Concepts (Simplified)
              </Heading>{" "}
              {/* Section Heading */}
              <List spacing={3} fontSize="md" pl={2}>
                {" "}
                {/* Increased font size and spacing */}
                <ListItem display="flex" alignItems="center">
                  <Icon
                    as={CheckCircleIcon}
                    color="green.400"
                    mr={3}
                    boxSize={5}
                  />
                  Token data (e.g., NFT metadata) resides off-chain for
                  cost-efficiency.
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Icon
                    as={CheckCircleIcon}
                    color="green.400"
                    mr={3}
                    boxSize={5}
                  />
                  A Merkle tree is constructed from this off-chain data.
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Icon
                    as={CheckCircleIcon}
                    color="green.400"
                    mr={3}
                    boxSize={5}
                  />
                  The tree's unique root hash is securely stored on the Solana
                  blockchain.
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Icon
                    as={CheckCircleIcon}
                    color="green.400"
                    mr={3}
                    boxSize={5}
                  />
                  Transactions (like transfers) are verified using Merkle
                  proofs, cryptographically linking the specific token to the
                  on-chain root.
                </ListItem>
              </List>
              <Divider borderColor="whiteAlpha.300" />
              <Heading size="md" fontWeight="semibold">
                Key Benefits
              </Heading>
              <Text fontSize="md" lineHeight="tall">
                <Text as="span" fontWeight="semibold">
                  - Massive Cost Reduction:
                </Text>{" "}
                Minting millions of tokens/NFTs becomes feasible.
                <br />
                <Text as="span" fontWeight="semibold">
                  - Enhanced Scalability:
                </Text>{" "}
                Supports Solana's growth in digital asset management.
                <br />
                <Text as="span" fontWeight="semibold">
                  - On-Chain Efficiency:
                </Text>{" "}
                Minimizes the blockchain footprint for token operations.
              </Text>
              <Divider borderColor="whiteAlpha.300" />
              <Heading size="md" fontWeight="semibold">
                Using This ZK Token Wallet
              </Heading>
              <List spacing={3} fontSize="md" pl={2}>
                <ListItem display="flex" alignItems="center">
                  <Text as="span" fontWeight="bold" mr={2} color={brandColor}>
                    1.
                  </Text>{" "}
                  Connect your Solana wallet (top-right).
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Text as="span" fontWeight="bold" mr={2} color={brandColor}>
                    2.
                  </Text>{" "}
                  Input a compressed token's mint address and click "Add Mint".
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Text as="span" fontWeight="bold" mr={2} color={brandColor}>
                    3.
                  </Text>{" "}
                  Select a mint from your saved list (if available).
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Text as="span" fontWeight="bold" mr={2} color={brandColor}>
                    4.
                  </Text>{" "}
                  Click "Check Selected" to view balance and metadata.
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Text as="span" fontWeight="bold" mr={2} color={brandColor}>
                    5.
                  </Text>{" "}
                  Use the "Send Tokens" section for transfers.
                </ListItem>
              </List>
              <Text fontSize="sm" color="gray.400" mt={4} textAlign="center">
                This wallet utilizes Light Protocol. Always exercise caution
                when interacting with decentralized applications.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="whiteAlpha.200">
            <Button colorScheme="brand" onClick={onInfoClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
}

export default App;
