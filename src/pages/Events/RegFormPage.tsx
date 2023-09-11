import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/20/solid';
import IconFeather from '../../Components/Icons/Feather';
import {Typography} from '../../Components/Tailwind';
import {LoadingIndicator} from '../../Components/Tailwind/LoadingIndicator';
import Table, {rowProps} from '../../Components/Tailwind/Table';
import TopTab from '../../Components/TopTab';
import db from '../../db/db';
import useAppState from '../../hooks/useAppState';
import {isLoading, hasValue, useQuery} from '../../utils/db';
import {wait} from '../../utils/wait';
import {NotFound} from '../NotFound';
import {syncEvent, syncParticipants, syncRegform} from './sync';
import {IndicoLink, Title} from './utils';

const RegistrationFormPage = () => {
  const {id, regformId} = useParams();
  const navigate = useNavigate();
  const {enableModal} = useAppState();
  const [isSyncing, setIsSyncing] = useState(false);

  const event = useQuery(() => db.events.get(Number(id)), [id]);
  const regform = useQuery(
    () => db.regforms.get({id: Number(regformId), eventId: Number(id)}),
    [id, regformId]
  );
  const participants = useQuery(
    () => db.participants.where({regformId: Number(regformId)}).sortBy('fullName'),
    [regformId]
  );

  useEffect(() => {
    async function _sync() {
      const controller = new AbortController();
      const event = await db.events.get({id: Number(id)});
      const regform = await db.regforms.get({id: Number(regformId)});
      if (!event || !regform) {
        return;
      }

      await syncEvent(event, controller.signal, enableModal);
      await syncRegform(event, regform, controller.signal, enableModal);
      await syncParticipants(event, regform, controller.signal, enableModal);
    }

    async function sync() {
      setIsSyncing(true);
      try {
        await _sync();
      } catch (err: any) {
        enableModal('Something went wrong when fetching updates', err.message);
      } finally {
        setIsSyncing(false);
      }
    }

    sync();
  }, [id, regformId, enableModal]);

  // Build the table rows array
  const tableRows: rowProps[] = useMemo(() => {
    if (!hasValue(event) || !hasValue(regform) || !hasValue(participants)) {
      return [];
    }

    return participants.map(({id, checkedIn, fullName}) => ({
      fullName,
      checkedIn,
      onClick: async () => {
        await wait(100);
        navigate(`/event/${event.id}/${regform.id}/${id}`, {state: {backBtnText: regform.title}});
      },
    }));
  }, [event, regform, participants, navigate]);

  const deleteRegform = async (id: number) => {
    try {
      await db.regforms.delete(id);
    } catch (err: any) {
      enableModal('Something went wrong when deleting a registration form', err.message);
    }
  };

  let topTab;
  if (hasValue(event) && hasValue(regform)) {
    topTab = (
      <TopTab
        settingsItems={[
          {
            text: 'Remove registration form',
            icon: <TrashIcon />,
            onClick: async () => {
              if (!hasValue(event) || !hasValue(regform)) {
                return;
              }

              await deleteRegform(regform.id);
              navigate(`/event/${event.id}`);
            },
          },
        ]}
      />
    );
  } else {
    topTab = <TopTab />;
  }

  if (isLoading(event) || isLoading(regform) || isLoading(participants)) {
    return topTab;
  }

  if (!event) {
    return (
      <>
        {topTab}
        <NotFound text="Event not found" icon={<CalendarDaysIcon />} />
      </>
    );
  } else if (!regform) {
    return (
      <>
        {topTab}
        <NotFound text="Registration form not found" icon={<IconFeather />} />
      </>
    );
  }

  return (
    <>
      {topTab}
      <div className="pt-1">
        <div>
          <div className="flex flex-col items-center gap-2 px-4">
            <Title title={regform.title} />
            <IndicoLink
              text="Indico registration page"
              url={`${event.baseUrl}/event/${event.indicoId}/manage/registration/${regform.indicoId}`}
            />
            <div className="flex items-center gap-2">
              <RegformStatus isOpen={regform.isOpen} />
              <RegistrationCount
                checkedInCount={regform.checkedInCount}
                registrationCount={regform.registrationCount}
              />
            </div>
          </div>
        </div>
        {participants.length === 0 && isSyncing && <LoadingParticipantsBanner />}
        {participants.length === 0 && !isSyncing && <NoParticipantsBanner />}
        {participants.length > 0 && (
          <div className="mt-6">
            <Table rows={tableRows} />
          </div>
        )}
      </div>
    </>
  );
};

export default RegistrationFormPage;

function RegformStatus({isOpen}: {isOpen: boolean | undefined}) {
  if (isOpen === undefined) {
    return null;
  }

  let color;
  if (isOpen) {
    color = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  } else {
    color = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }

  return (
    <span className={`w-fit text-xs font-medium px-2.5 py-0.5 rounded-full ${color}`}>
      {isOpen ? 'open' : 'closed'}
    </span>
  );
}

function RegistrationCount({
  checkedInCount,
  registrationCount,
}: {
  checkedInCount: number;
  registrationCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex self-center items-center rounded-full overflow-hidden">
        <div
          className="flex items-center text-xs font-medium pl-2.5 py-0.5 bg-blue-100
                     text-primary dark:bg-darkSecondary dark:text-secondary"
        >
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          <Typography variant="body1">{checkedInCount}</Typography>
        </div>
        <div
          className="flex items-center text-xs font-medium px-2.5 py-0.5 bg-blue-100
                     text-primary dark:bg-darkSecondary dark:text-secondary"
        >
          <UserGroupIcon className="w-4 h-4 mr-1" />
          <Typography variant="body1">{registrationCount}</Typography>
        </div>
      </div>
    </div>
  );
}

function NoParticipantsBanner() {
  return (
    <div className="mx-4 mt-10 bg-gray-100 dark:bg-gray-800 px-3 pb-2 rounded-xl">
      <div className="flex flex-col gap-2 items-center justify-center px-6 pt-10 pb-12 rounded-xl">
        <UserGroupIcon className="w-14 text-gray-500" />
        <Typography variant="h3" className="text-center">
          There are no registered participants
        </Typography>
      </div>
    </div>
  );
}

function LoadingParticipantsBanner() {
  return (
    <div className="mx-4 mt-10 flex flex-col gap-2">
      <Typography variant="h3" className="text-center">
        Updating participants..
      </Typography>
      <LoadingIndicator size="md" />
    </div>
  );
}
