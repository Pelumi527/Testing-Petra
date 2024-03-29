import React, { useEffect } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Types } from "aptos";
import { sleep } from "@/lib/utils";
import { da, enUS, enGB } from "date-fns/locale";

type RecipientGifts = {
  from: string;
  amount: number;
  timestamp: number;
};

/* 
  Lists all of the user's received gifts. Allows the user to claim gifts whose release time has 
  passed.
*/
export default function ReceivedGiftList(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  // Lists of gifts sent to the user
  const [gifts, setGifts] = React.useState<RecipientGifts[]>([]);
  // State for the wallet
  const { account, connected, signAndSubmitTransaction } = useWallet();

  /* 
    Get's the gifts sent to the user when the account, connected, or isTxnInProgress state 
    variables change. 
  */
  useEffect(() => {
    if (connected) {
      getGifts().then((gifts) => {
        setGifts(gifts);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  /* 
    Gets the gifts sent to the user.
  */
  const getGifts = async () => {
    /*
      TODO #2: Validate the account is defined before continuing. If not, return.
    */
    if (!account) {
      return [];
    }
    /* 
      TODO #3: Make a view function call to the view_recipients_gifts function in the birthday_bot 
            module to get the gifts sent to the user.
    */
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::view_recipients_gifts`,
      type_arguments: [],
      arguments: [account.address],
    };

    let result;
    try {
      result = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/view`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    } catch (error) {
      return [];
    }
    /*
      TODO #4: Take the response from the view request and parse it into a list of gifts. The gifts 
            should then be sorted by their release time in ascending order. Return the sorted list
            of gifts. 

      HINT:
        - Remember to convert the amount to floating point format
    */
    const data = await result.json();
    let parseData: RecipientGifts[] = [];
    for (let i = 0; i < data[0].length; i++) {
      let obj: RecipientGifts = {
        from: data[0][i],
        amount: data[1][i],
        timestamp: data[2][i],
      };
      parseData.push(obj);
    }

    
    let sortedData = parseData.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });

    return sortedData; // PLACEHOLDER
  };

  /* 
    Claims a gift sent to the user.
  */
  const claimGift = async (giftSender: string) => {
    /* 
      TODO #6: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);
    /*
      TODO #7: Submit a transactions to the claim_birthday_gift function in the birthday_bot module to 
      claim the gift sent from the `giftSender` address.
      

      HINT: 
        - Use a try/catch block to catch any errors that may occur. In the case of an error, set the
          isTxnInProgress prop to false and return.
    */

    const payload: Types.TransactionPayload = {
      type: "entry_function_payload",
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::claim_birthday_gift`,
      type_arguments: [],
      arguments: [giftSender],
    };
    try {
      const result = await signAndSubmitTransaction(payload);
      await sleep(
        parseInt(`${process.env.TRANSACTION_DELAY_MILLISECONDS}` || "0")
      );
    } catch (error) {
      props.setTxn(false);
    }
    /*
      TODO #8: Set the `isTxnInProgress` state to false.
    */

    props.setTxn(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div>
        <CardTitle className="my-2">Gifts sent to you!</CardTitle>
        <CardDescription className="break-normal w-96">
          View and open all of your gifts! You can only open gifts after the
          release time has passed. Spend your gifts on something nice!
        </CardDescription>
      </div>
      <ScrollArea className="border rounded-lg">
        <div className="h-fit max-h-56">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">From</TableHead>
                <TableHead className="text-center">Amount</TableHead>
                <TableHead className="text-center">Release time</TableHead>
                <TableHead className="text-center">Claim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                /* 
                  TODO #1: If the user has no gifts, display a table row with a message saying that
                        the user has no gifts. Use the provided components to display the message.

                  HINT: 
                    - Use the gifts state variable to determine if the user has any gifts.

                  -- Message Component --
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="text-center break-normal w-80">
                        You have no gifts yet. Send some gifts to your friends for their birthdays!
                      </p>
                    </TableCell>
                  </TableRow>
                */
                gifts.length == 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <p className="text-center break-normal w-80">
                        You have no gifts yet. Send some gifts to your friends
                        for their birthdays!
                      </p>
                    </TableCell>
                  </TableRow>
                )
              }
              {
                /* 
                  TODO #5: Iterate through the gifts state variable and display each gift in a table row.
                        Use the provided components to display the gift information.

                  HINT: 
                    - For the key of each `TableRow`, use the index of the gift in the gifts state 
                      variable.

                  -- Gift Row Component --
                */
                gifts.map((gift, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {/* PLACEHOLDER: Display the truncated address of the
                            gift sender here HINT: Show the first 6 characters
                            of the address (including 0x), followed by '...',
                            then the last 4 characters of the address */}
                            {gift?.from.slice(0, 5)}...
                            {gift?.from.slice(-4)}
                            
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{gift?.from}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-mono text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {/* PLACEHOLDER: Show the gift amount in APT here
                            (rounded to 2 decimal places) HINT: Remember to show
                            the unit of the amount (APT) after the amount */}
                            {`${(gift.amount / 100000000).toFixed(2)} APT`}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {/* PLACEHOLDER: Show the gift amount in APT here
                              (rounded to 8 decimal places) HINT: Remember to
                              show the unit of the amount (APT) after the amount */}
                              {`${(gift.amount / 100000000).toFixed(8)} APT`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="underline">
                            {/* PLACEHOLDER: Show the release date of the gift here
                            HINT: - Convert the timestamp to a Date object and
                            use the toLocaleDateString() method to format the
                            date - Note that the timestamp from Aptos is in
                            seconds, but not milliseconds */}
                            {new Date(gift.timestamp * 1000).toLocaleDateString(
                              "en-GB",
                              {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {/* PLACEHOLDER: Show the release date and time of the
                              gift here HINT: - Convert the timestamp to a Date
                              object and use the toLocaleString() method to
                              format the date and time - Note that the timestamp
                              from Aptos is in seconds, but not milliseconds */}
                              {new Date(
                                gift.timestamp * 1000
                              ).toLocaleString('en-GB', {
                                timeZone:"Europe/London",
                                hour12:false,
                                
                              })}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          // PLACEHOLDER: Call the claimGift function here
                          // PLACEHOLDER: Disable the claim button if the gift's release time has not passed
                          // HINT: Do this by setting the disabled prop (below) to true or false
                          //        depending on if the gift's release time has passed

                          claimGift(gift.from)
                          
                        }}
                        disabled={(gift.timestamp * 1000) >= Date.now()}
                      >
                        Claim
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </div>
  );
}
