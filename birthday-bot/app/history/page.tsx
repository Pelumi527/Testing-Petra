"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Unplug, Home } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import TypographyH2 from "@/components/TypographyH2";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import WalletSelector from "../../components/walletSelector";
import TypographyH1 from "@/components/TypographyH1";
import { TypographyP } from "@/components/TypographyP";
import { HistoryTable } from "./HistoryTable";
import { Event, columns } from "./columns";

/* 
  This page displays the history of the user's account.
  It fetches all the events from the blockchain and filters
  them to only show the events that are relevant to the user.
*/
export default function HistoryPage() {
  const { connected, account, isLoading, network } = useWallet();
  const [data, setData] = useState<Event[]>([]);
  const [accountExists, setAccountExists] = useState<Boolean>(true);

  /*
    Checks if the connected account exists whenever the connected and account variables change.
    Also fetches the events from the birthday_bot module and filters them to only show the events 
    that are relevant to the user.
  */
  useEffect(() => {
    checkIfAccountExists();

    if (connected && account) {
      getEvents().then((events:any) => {
        /* 
          Check if the account address has any leading zeros after the '0x' prefix. If it does,
          remove the leading zeros. This is to account for the fact that the account address
          from the wallet provider may have leading zeros, but the account address from the module 
          events does not have leading zeros.
        */
        while (account.address.startsWith("0x0")) {
          account.address = account.address.replace("0x0", "0x");
        }
        /* 
          Organizes, filters, and sorts the events to only show the events that are relevant to the
          user.
        */
        setData(
          events
            .map((event: any) => {
              let event_type:
                | "add-birthday-gift"
                | "claim-birthday-gift"
                | "cancel-birthday-gift"
                | undefined;
              let recipient = event.data.recipient;
              let amount = event.data.gift_amount_apt;
              let gifter = event.data.gifter;
              let giftTimestamp = event.data.birthday_timestamp_seconds;
              if (
                event.type ===
                `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::BirthdayGiftAddedEvent`
              ) {
                event_type = "add-birthday-gift";
              } else if (
                event.type ===
                `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::BirthdayGiftClaimedEvent`
              ) {
                event_type = "claim-birthday-gift";
              } else if (
                event.type ===
                `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::BirthdayGiftRemovedEvent`
              ) {
                event_type = "cancel-birthday-gift";
              }
              return {
                id: parseInt(
                  `${
                    event.sequence_number
                  }${event.guid.creation_number.toString()}`
                ),
                type: event_type,
                eventTimestamp: event.data.event_creation_timestamp_seconds,

                recipient: recipient,
                amount: amount,
                gifter: gifter,
                giftTimestamp: giftTimestamp,
              };
            })
            .filter((event: Event) => {
              return (
                event.recipient === account?.address ||
                event.gifter === account?.address
              );
            })
            .sort((a: Event, b: Event) => {
              return a.eventTimestamp - b.eventTimestamp;
            })
            .reverse()
        );
      });
    } else {
      setData([]);
    }
  }, [connected, account]);

  const checkIfAccountExists = async () => {
    /* 
      TODO #1: Make a request to the api endpoint to retrieve the account data. If the request returns 
            an object that contains error code of `account_not_found`, set the accountExists state 
            to false. Otherwise, set the accountExists state to true.

      HINT: 
        - If the connected and account variables are false or undefined (respectively), return 
          early.
    */

    if (!connected && !account) {
      return;
    }

    try {
      const response = await fetch(
        `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account?.address}`,
        {
          method: "GET",
        }
      );
      const accountData = await response.json();
      if (accountData?.error_code === "account_not_found") {
        setAccountExists(false);
      } else {
        setAccountExists(true);
      }
    } catch (error) {
      console.log(error);
      setAccountExists(false);
    }
  };

  /* 
    Fetches the events emitted from the birthday_bot module.
  */
  const getEvents = async () => {
    /* 
      TODO #4: 
        - Make a request to the Aptos API to query the birthday_gift_added_events emitted from the 
            birthday_bot module. 
        - Make a request to the Aptos API to query the birthday_gift_claimed_events emitted from the
            birthday_bot module.
        - Make a request to the Aptos API to query the birthday_gift_removed_events emitted from the
            birthday_bot module.
        - Then parse the responses and return the concatenated array of events. 
    */
    const response_birthday_gift_added_events = await fetch(
      `https://fullnode.testnet.aptoslabs.com/v1/accounts/${process.env.RESOURCE_ACCOUNT_ADDRESS}/events/${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::ModuleEvents/birthday_gift_added_events`,
      {
        method: "GET",
      }
    );

    const BIRTHDAY_GIFT_ADDED_EVENT_DATA:[] =
      await response_birthday_gift_added_events.json();

    const RESPONSE_birthday_gift_claimed_events = await fetch(
      `https://fullnode.testnet.aptoslabs.com/v1/accounts/${process.env.RESOURCE_ACCOUNT_ADDRESS}/events/${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::ModuleEvents/birthday_gift_claimed_events`,
      {
        method: "GET",
      }
    );

    const BIRTHDAY_GIFT_CLAIMED_EVENT_DATA:[] =
      await RESPONSE_birthday_gift_claimed_events.json();

    const RESPONSE_BIRTHDAY_GIFT_REMOVED_EVENTS_DATA = await fetch(
      `https://fullnode.testnet.aptoslabs.com/v1/accounts/${process.env.RESOURCE_ACCOUNT_ADDRESS}/events/${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::ModuleEvents/birthday_gift_removed_events`,
      {
        method: "GET",
      }
    );

    const BIRTHDAY_GIFT_REMOVED_EVENTS_DATA:[] =
      await RESPONSE_BIRTHDAY_GIFT_REMOVED_EVENTS_DATA.json();

    
      let eventData = BIRTHDAY_GIFT_ADDED_EVENT_DATA.concat(BIRTHDAY_GIFT_CLAIMED_EVENT_DATA).concat(BIRTHDAY_GIFT_REMOVED_EVENTS_DATA)
      return eventData
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen max-h-min max-w-screen dark:bg-slate-950">
      <div className="flex flex-col items-center justify-between w-full px-40 my-2 max-w-screen-2xl lg:flex-row">
        <TypographyH2>Birthday Bot</TypographyH2>
        <div className="flex flex-row justify-around gap-2">
          <ThemeToggle />
          <a href="/">
            <Button variant="outline">
              Home
              <Home className="ml-2" size={16} />
            </Button>
          </a>
          <WalletSelector />
        </div>
      </div>
      <Separator />
      <div className="h-full mt-4">
        <div className="flex flex-col items-center">
          <TypographyH1>Account History</TypographyH1>
          <TypographyP>View your account history below.</TypographyP>
        </div>
        <HistoryTable columns={columns} data={data} />
      </div>
      {
        /*
          TODO #2: Show the alert when the wallet is not connected to the correct network (Testnet). 
                Use the provided component.

          HINT:
            - Use the `connected` variable to check if the wallet is connected. Do not show the alert
              if the wallet is not connected.
            - Use the `isLoading` variable to check if the wallet is loading. Do not show the alert
              if the wallet is loading.
            - Use the `network` variable to check if the network is Testnet.

          -- Alert Component --
          
        */
        connected && !isLoading && network?.name.toString() !== "Testnet" && (
          <div className="flex flex-row items-end justify-end w-full h-full grow">
            <Alert variant="destructive" className="mb-2 mr-2 w-fit">
              <Unplug className="w-4 h-4" />
              <AlertTitle>Switch your network!</AlertTitle>
              <AlertDescription>
                Switch your network to Testnet to use this app.
              </AlertDescription>
            </Alert>
          </div>
        )
      }
      {
        /*
          TODO #3: Show the alert when the connected account does not exist. Use the provided component.

          HINT:
            - Use the `connected` variable to check if the wallet is connected. Do not show the alert
              if the wallet is not connected.
            - Use the `isLoading` variable to check if the wallet is loading. Do not show the alert
              if the wallet is loading.
            - Use the `accountExists` variable to check if the connected account exists on Testnet.

          -- Alert Component --
          
        */
        connected &&
          !isLoading &&
          !accountExists &&
          network?.name.toString() === "Testnet" && (
            <div className="flex flex-row items-end justify-end w-full h-full grow">
              <Alert variant="destructive" className="mb-2 mr-2 w-fit">
                <Unplug className="w-4 h-4" />
                <AlertTitle>Account not found!</AlertTitle>
                <AlertDescription>
                  Please make sure your account is exists on Testnet and try
                  again.
                </AlertDescription>
              </Alert>
            </div>
          )
      }
    </div>
  );
}
